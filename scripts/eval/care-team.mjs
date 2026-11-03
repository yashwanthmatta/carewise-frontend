// Account → Care team. Synthetic data and a mocked API only.
// Hidden when signed out, when there is no saved profile, or when the server has no clinician-access
// API yet. Otherwise: lists current clinicians (not removed or expired ones), adds one by email,
// explains a refused address, and removes one after a confirm.
// Usage: serve the site on :4173, then node scripts/eval/care-team.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const future = new Date(Date.now() + 30 * 864e5).toISOString();
const past = new Date(Date.now() - 864e5).toISOString();
function makeServer({ careTeamApi = true, profile = true } = {}) {
  const grants = [
    { id: "g1", clinician_email: "dr.one@clinic.example", created_at: "2026-10-01T10:00:00Z", expires_at: null, revoked_at: null },
    { id: "g2", clinician_email: "dr.timed@clinic.example", created_at: "2026-10-02T10:00:00Z", expires_at: future, revoked_at: null },
    { id: "g3", clinician_email: "dr.removed@clinic.example", created_at: "2026-09-01T10:00:00Z", expires_at: null, revoked_at: "2026-09-10T10:00:00Z" },
    { id: "g4", clinician_email: "dr.expired@clinic.example", created_at: "2026-09-01T10:00:00Z", expires_at: past, revoked_at: null },
  ];
  const calls = [];
  const handler = async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (url.pathname === "/patients/me/profile") return json(200, { profile: profile ? { id: "patient_synthetic" } : null });
    if (url.pathname.startsWith("/patients/patient_synthetic/care-team")) {
      if (!careTeamApi) return json(404, { detail: "Not Found" });
      calls.push(`${request.method()} ${url.pathname}`);
      if (request.method() === "GET") return json(200, { items: grants });
      if (request.method() === "POST") {
        const body = JSON.parse(request.postData() || "{}");
        if (body.clinician_email !== "dr.new@clinic.example") return json(400, { detail: "That address is not a FollowThrough Health clinician account." });
        grants.push({ id: "g5", clinician_email: body.clinician_email, created_at: new Date().toISOString(), expires_at: body.days ? future : null, revoked_at: null });
        calls.push(`days=${body.days}`);
        return json(200, grants.at(-1));
      }
      if (request.method() === "DELETE") {
        const id = url.pathname.split("/").pop();
        const grant = grants.find((g) => g.id === id);
        grant.revoked_at = new Date().toISOString();
        return json(200, { id, revoked_at: grant.revoked_at });
      }
    }
    return json(503, {});
  };
  return { handler, calls };
}

const browser = await chromium.launch();
async function open({ signedIn = true, ...options } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const server = makeServer(options);
  await context.route(/carewise-api\.onrender\.com/, server.handler);
  if (signedIn) await context.addInitScript(() => { localStorage.setItem("carewiseAuthToken", "synthetic-token"); localStorage.setItem("carewiseAuthEmail", "patient@example.com"); });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}#clinician-access`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  return { page, context, server, errors };
}

{
  const { page, context, errors } = await open({ signedIn: false });
  ok(await page.isHidden("#clinician-access"), "signed out: no care team panel");
  ok(errors.length === 0, "signed out: no script errors");
  await context.close();
}
{
  const { page, context } = await open({ careTeamApi: false });
  ok(await page.isHidden("#clinician-access"), "server without the clinician-access API: panel stays hidden");
  await context.close();
}
{
  const { page, context } = await open({ profile: false });
  ok(await page.isHidden("#clinician-access"), "no saved profile: panel stays hidden");
  await context.close();
}
{
  const { page, context, server, errors } = await open();
  ok(await page.isVisible("#clinician-access"), "signed in with a profile: panel shows");
  ok(await page.evaluate(() => document.body.dataset.activeWorkspace === "account-title"), "a #clinician-access link opens the Account screen");
  await page.goto(`${base}#home-title`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  ok(await page.isHidden("#clinician-access"), "care team is not shown on Home");
  await page.goto(`${base}#clinician-access`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const names = await page.$$eval("#clinician-access-list li strong", (els) => els.map((e) => e.textContent));
  ok(names.join(",") === "dr.one@clinic.example,dr.timed@clinic.example", `only current clinicians are listed (${names.join(", ")})`);
  const rows = await page.$$eval("#clinician-access-list li", (els) => els.map((e) => e.textContent.replace(/\s+/g, " ")));
  ok(rows[0].includes("until you remove them") && /until \w/.test(rows[1]), "each row says how long access lasts");

  await page.click("#clinician-access-add");
  ok(/Enter the clinician's email/.test(await page.textContent("#clinician-access-status")), "empty email is explained, nothing sent");
  ok(!server.calls.some((c) => c.startsWith("POST")), "no request for an empty email");

  await page.fill("#clinician-access-email", "someone@else.example");
  await page.click("#clinician-access-add");
  await page.waitForTimeout(400);
  ok(/isn't a confirmed FollowThrough Health clinician account/.test(await page.textContent("#clinician-access-status")), "a refused address is explained in plain words");

  await page.fill("#clinician-access-email", "dr.new@clinic.example");
  await page.selectOption("#clinician-access-days", "90");
  await page.click("#clinician-access-add");
  await page.waitForTimeout(500);
  ok(server.calls.includes("days=90"), "the chosen time is sent");
  ok((await page.textContent("#clinician-access-list")).includes("dr.new@clinic.example"), "the new clinician appears in the list");
  ok((await page.inputValue("#clinician-access-email")) === "", "the email box is cleared");

  page.once("dialog", (d) => d.dismiss());
  await page.click('[data-clinician-remove="g1"]');
  await page.waitForTimeout(300);
  ok(!server.calls.some((c) => c.startsWith("DELETE")), "cancelling the confirm removes nobody");
  page.once("dialog", (d) => d.accept());
  await page.click('[data-clinician-remove="g1"]');
  await page.waitForTimeout(500);
  ok(server.calls.some((c) => c === "DELETE /patients/patient_synthetic/care-team/g1"), "Remove calls the API for that grant");
  ok(!(await page.textContent("#clinician-access-list")).includes("dr.one@clinic.example"), "the removed clinician leaves the list");
  ok(/can no longer see your records/.test(await page.textContent("#clinician-access-status")), "removal is confirmed in words");
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "fits a phone screen");
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();
}
await browser.close();
if (failures) { console.error(`${failures} care team check(s) failed`); process.exit(1); }
console.log("All care team checks passed");
