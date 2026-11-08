// Account notice for clinic staff who must turn on two-step sign-in (backend setting
// CAREWISE_STAFF_TWO_FACTOR_REQUIRED). Synthetic data and a mocked API only.
// The notice shows only when /auth/me says staff_two_factor_needed, links to Two-step sign-in,
// and goes away once two-step sign-in is turned on. Servers that don't send the field show nothing.
// Usage: serve the site on :4173, then node scripts/eval/staff-two-factor.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

function makeServer({ sendField = true, needed = true } = {}) {
  const state = { totp: false };
  const handler = async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (url.pathname === "/health") return json(200, { status: "ok", service: "FollowThrough Health API" });
    if (url.pathname === "/ready") return json(200, { status: "ready" });
    if (url.pathname === "/auth/me") {
      const body = { id: "user_synthetic", email: "staff@clinic.example", role: "patient", email_verified: true, two_factor_enabled: state.totp };
      if (sendField) body.staff_two_factor_needed = needed && !state.totp;
      return json(200, body);
    }
    if (url.pathname === "/auth/two-factor/setup") return json(200, { secret: "JBSWY3DPEHPK3PXP", otpauth_url: "otpauth://totp/FollowThrough:staff@clinic.example?secret=JBSWY3DPEHPK3PXP" });
    if (url.pathname === "/auth/two-factor/enable") {
      state.totp = true;
      return json(200, { enabled: true, recovery_codes: ["aaaa-bbbb", "cccc-dddd"] });
    }
    return json(503, {});
  };
  return { handler, state };
}

const browser = await chromium.launch();
async function open({ signedIn = true, hash = "account-title", ...options } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const server = makeServer(options);
  await context.route(/carewise-api\.onrender\.com/, server.handler);
  if (signedIn) {
    await context.addInitScript(() => {
      localStorage.setItem("carewiseAuthToken", "synthetic-token");
      localStorage.setItem("carewiseAuthEmail", "staff@clinic.example");
      localStorage.setItem("carewiseEmailVerified", "true");
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}#${hash}`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  return { page, context, server, errors };
}

{
  const { page, context, errors } = await open({ signedIn: false });
  ok(await page.isHidden("#account-staff-2fa"), "signed out: no staff notice");
  ok(errors.length === 0, "signed out: no script errors");
  await context.close();
}
{
  const { page, context } = await open({ sendField: false });
  ok(await page.isHidden("#account-staff-2fa"), "server that doesn't send staff_two_factor_needed: no notice");
  await context.close();
}
{
  const { page, context } = await open({ needed: false });
  ok(await page.isHidden("#account-staff-2fa"), "patient account (field false): no notice");
  await context.close();
}
{
  const { page, context, errors } = await open();
  ok(await page.isVisible("#account-staff-2fa"), "staff account waiting on two-step sign-in: notice shows on Account");
  const text = (await page.textContent("#account-staff-2fa")) || "";
  ok(/Turn on two-step sign-in to use your clinic tools/.test(text), "notice says what to do");
  ok(/review queue/.test(text) && /patient account/.test(text), "notice says what is closed until then");
  ok((await page.getAttribute("#account-staff-2fa", "role")) === "status", "notice is announced to screen readers (role=status)");
  const link = page.locator('#account-staff-2fa a[href="#twofactor-title"]');
  ok((await link.count()) === 1, "notice links to Two-step sign-in");
  await link.click();
  await page.waitForTimeout(400);
  ok(await page.isVisible("#tf-start"), "link opens Two-step sign-in with the Turn on button");

  await page.click("#tf-start");
  await page.waitForSelector("#tf-enable-code", { state: "visible" });
  await page.fill("#tf-enable-code", "123456");
  await page.click("#tf-enable");
  await page.waitForSelector("#tf-codes", { state: "visible" });
  await page.waitForTimeout(600);
  ok(await page.isHidden("#account-staff-2fa"), "after turning on two-step sign-in: notice goes away without a reload");
  ok(errors.length === 0, `staff flow: no script errors${errors.length ? ` (${errors.join("; ")})` : ""}`);
  await context.close();
}
{
  // Signing out clears it.
  const { page, context } = await open();
  ok(await page.isVisible("#account-staff-2fa"), "notice shows before signing out");
  await page.evaluate(() => { clearAuthSession(); updateAuthStatus(""); });
  ok(await page.isHidden("#account-staff-2fa"), "after signing out: notice hidden");
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll staff two-step sign-in notice checks passed");
process.exit(failures ? 1 : 0);
