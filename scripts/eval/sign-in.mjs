// The sign-in card works as a person expects, on desktop and phone, with a stand-in server:
// tabs, Enter key, show password, busy state, wrong password, two-step code, forgot password,
// signed-in view and log out. The server is mocked, so no account is created anywhere.
// Usage: serve the site on :4173, then node scripts/eval/sign-in.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };

const GOOD = "a-long-enough-password-1";
const json = (route, status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
const tokens = { access_token: "test-access-token", refresh_token: "test-refresh-token", token_type: "bearer" };

const browser = await chromium.launch();
const errors = [];
for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const tag = `[${viewport.width}]`;
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  const calls = [];
  let loginDelay = 0;
  await context.route(/carewise-api\.onrender\.com/, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON?.() || {};
    calls.push(path);
    if (path === "/auth/signup") return json(route, 201, tokens);
    if (path === "/auth/login") {
      if (loginDelay) await new Promise((resolve) => setTimeout(resolve, loginDelay));
      if (body.password !== GOOD) return json(route, 401, { detail: "Invalid credentials" });
      if (body.email === "two-step@example.com") return json(route, 200, { two_factor_required: true, challenge: "challenge-1" });
      return json(route, 200, tokens);
    }
    if (path === "/auth/login/two-factor") return body.code === "123456" ? json(route, 200, tokens) : json(route, 401, { detail: "Bad code" });
    if (path === "/auth/password-reset/request") return json(route, 200, { delivery_status: "email_queued" });
    if (path === "/auth/me") return json(route, 200, { email: "person@example.com", role: "patient", email_verified: true });
    return json(route, 200, {});
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${tag} ${e.message}`));
  await page.goto(`${base}#account-title`, { waitUntil: "load" });
  const status = () => page.textContent("#auth-status").then((text) => text.trim());

  // Opens on Sign in, with one obvious button.
  ok(await page.isVisible("#login") && await page.isHidden("#signup"), `${tag} opens on Sign in with one main button`);
  ok(await page.getAttribute("#auth-tab-signin", "aria-selected") === "true", `${tag} Sign in tab is selected`);

  // Show password.
  await page.fill("#auth-password", "secret");
  await page.click('[data-password-toggle="auth-password"]');
  ok(await page.getAttribute("#auth-password", "type") === "text", `${tag} Show reveals the password`);
  await page.click('[data-password-toggle="auth-password"]');
  ok(await page.getAttribute("#auth-password", "type") === "password", `${tag} Hide masks it again`);

  // Wrong password, submitted with Enter; the button shows it is working meanwhile.
  loginDelay = 600;
  await page.fill("#auth-email", "person@example.com");
  await page.fill("#auth-password", "wrong-password-123");
  await page.press("#auth-password", "Enter");
  await page.waitForTimeout(150);
  ok(await page.getAttribute("#login", "aria-busy") === "true", `${tag} Sign in shows it is working`);
  await page.waitForFunction(() => document.querySelector("#auth-status").textContent.trim(), null, { timeout: 5000 });
  ok(/incorrect/i.test(await status()), `${tag} wrong password says so (${await status()})`);
  ok(await page.getAttribute("#login", "aria-busy") === null, `${tag} busy state clears after the answer`);
  loginDelay = 0;

  // Create account tab: the hint and terms appear; Enter creates the account.
  await page.click("#auth-tab-signup");
  ok(await page.isVisible("#signup") && await page.isHidden("#login"), `${tag} Create account shows its own button`);
  ok(await page.isVisible("#auth-password-hint"), `${tag} password rule is shown before typing`);
  ok(await page.getAttribute("#auth-password", "autocomplete") === "new-password", `${tag} password managers offer a new password`);
  await page.fill("#auth-password", "short");
  await page.press("#auth-password", "Enter");
  await page.waitForTimeout(200);
  ok(/12 characters/.test(await status()), `${tag} short password is explained`);
  ok(!calls.includes("/auth/signup"), `${tag} short password is not sent`);
  await page.fill("#auth-password", GOOD);
  await page.press("#auth-password", "Enter");
  await page.waitForFunction(() => document.body.dataset.auth === "in", null, { timeout: 5000 }).catch(() => {});
  ok(calls.includes("/auth/signup"), `${tag} Enter on Create account signs up`);
  ok(await page.isVisible("#account-home") && await page.isHidden("#auth-card"), `${tag} signed-in view replaces the form`);
  ok(/person@example\.com/.test(await page.textContent("#signed-in-label")), `${tag} shows who is signed in`);
  ok(viewport.width < 721 || await page.isVisible(".nav-signin .when-in"), `${tag} header link says Account`);

  // Log out returns to the form.
  await page.click("#logout");
  await page.waitForFunction(() => document.body.dataset.auth === "out", null, { timeout: 5000 }).catch(() => {});
  ok(await page.isVisible("#auth-card"), `${tag} log out shows the sign-in card again`);

  // Two-step sign-in.
  await page.click("#auth-tab-signin");
  await page.fill("#auth-email", "two-step@example.com");
  await page.fill("#auth-password", GOOD);
  await page.click("#login");
  await page.waitForSelector("#tf-login:not([hidden])", { timeout: 5000 }).catch(() => {});
  ok(await page.isVisible("#tf-login-code"), `${tag} two-step code box appears`);
  await page.fill("#tf-login-code", "123456");
  await page.click("#tf-login-submit");
  await page.waitForFunction(() => document.body.dataset.auth === "in", null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => document.body.dataset.auth === "in"), `${tag} correct code signs in`);
  await page.click("#logout");
  await page.waitForTimeout(300);

  // Forgot password: its own step, and back.
  await page.click('[data-auth-go="forgot"]');
  ok(/Reset your password/.test(await page.textContent("[data-auth-title]")), `${tag} Forgot password opens the reset step`);
  ok(await page.isHidden("#auth-password") && await page.isVisible("#password-reset"), `${tag} reset step asks only for the email`);
  await page.fill("#auth-email", "person@example.com");
  await page.press("#auth-email", "Enter");
  await page.waitForTimeout(400);
  ok(calls.includes("/auth/password-reset/request") && /Check your inbox/.test(await status()), `${tag} Enter sends the reset email`);
  await page.click('.auth-back');
  ok(await page.isVisible("#login"), `${tag} Back to sign in returns`);

  // Keyboard: arrow keys move between the tabs.
  await page.focus("#auth-tab-signin");
  await page.keyboard.press("ArrowRight");
  ok(await page.getAttribute("#auth-tab-signup", "aria-selected") === "true", `${tag} arrow keys switch tabs`);

  // Nothing wider than the screen.
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag} fits the screen`);
  await context.close();
}

// A reset link from the email opens the reset step with the code filled in.
{
  const page = await browser.newPage();
  await page.route(/carewise-api\.onrender\.com/, (route) => json(route, 200, {}));
  await page.goto(`${base}?reset_token=abc123#account-title`, { waitUntil: "load" });
  ok(/Reset your password/.test(await page.textContent("[data-auth-title]")) && await page.inputValue("#reset-token") === "abc123", "reset link opens the reset step with its code");
  ok(await page.isVisible("#reset-password"), "new password box is open");
  await page.close();
}

await browser.close();
ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
if (failures) {
  console.error(`${failures} sign-in check(s) failed`);
  process.exit(1);
}
console.log("All sign-in checks passed");
