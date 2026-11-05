// Continue with Google / Apple / Microsoft and Account → Sign-in methods.
// Synthetic accounts and a mocked API only; no real provider is contacted.
// Usage: serve the site on :4173, then node scripts/eval/provider-sign-in.mjs
import { createHash } from "node:crypto";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failures = 0;
const ok = (cond, message) => { if (!cond) failures += 1; console.log(`${cond ? "ok  " : "FAIL"} ${message}`); };
const sha = (text) => createHash("sha256").update(text).digest("hex");

function server(options = {}) {
  const state = { calls: [], startBody: null, exchangeBody: null, identities: options.identities || [], ...options };
  const handler = async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    state.calls.push(`${request.method()} ${url.pathname}`);
    if (url.pathname === "/auth/providers") return json(200, { providers: state.providers || [] });
    if (url.pathname.endsWith("/start") || url.pathname.endsWith("/link-start")) {
      state.startBody = JSON.parse(request.postData() || "{}");
      const hosts = { google: "https://accounts.google.com/o/oauth2/v2/auth", apple: "https://appleid.apple.com/auth/authorize", microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize" };
      const provider = url.pathname.split("/")[3];
      return json(200, { authorization_url: state.authorizationUrl || `${hosts[provider]}?client_id=test` });
    }
    if (url.pathname === "/auth/oidc/exchange") {
      state.exchangeBody = JSON.parse(request.postData() || "{}");
      if (state.exchangeStatus) return json(state.exchangeStatus, { detail: { code: "x", message: "x" } });
      return json(200, state.exchangeResponse || { access_token: "synthetic-access", refresh_token: "synthetic-refresh", created: true });
    }
    if (url.pathname === "/auth/me") return json(200, { email: "provider.user@example.com", role: "patient", email_verified: true });
    if (url.pathname === "/auth/identities") {
      if (state.noIdentitiesApi) return json(404, { detail: "Not Found" });
      return json(200, { email: "provider.user@example.com", has_password: state.hasPassword ?? true, available: state.available || [], identities: state.identities });
    }
    if (url.pathname.startsWith("/auth/identities/") && url.pathname.endsWith("/remove")) {
      state.removeBody = JSON.parse(request.postData() || "{}");
      if (state.removeStatus) return json(state.removeStatus, { detail: "x" });
      state.identities = state.identities.filter((item) => !url.pathname.includes(item.id));
      return json(200, { status: "removed" });
    }
    return json(503, {});
  };
  return { state, handler };
}

const browser = await chromium.launch();
async function open(options = {}, { hash = "account-title", signedIn = false, secret } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const api = server(options);
  await context.route(/carewise-api\.onrender\.com/, api.handler);
  await context.route(/accounts\.google\.com|appleid\.apple\.com|login\.microsoftonline\.com/, (route) => {
    api.state.providerPage = route.request().url();
    return route.fulfill({ status: 200, contentType: "text/html", body: "<title>provider</title>" });
  });
  await context.addInitScript(([token, value]) => {
    if (token && !localStorage.getItem("carewiseAuthToken")) { localStorage.setItem("carewiseAuthToken", token); localStorage.setItem("carewiseAuthEmail", "provider.user@example.com"); }
    if (value && !sessionStorage.getItem("seeded")) { sessionStorage.setItem("carewiseSignInSecret", value); sessionStorage.setItem("seeded", "1"); }
  }, [signedIn ? "synthetic-token" : "", secret || ""]);
  const page = await context.newPage();
  // Answer confirm/prompt dialogs in order from a queue: ["accept"], ["dismiss"] or ["accept", text].
  page.dialogQueue = [];
  page.on("dialog", (dialog) => {
    const [action, text] = page.dialogQueue.shift() || ["dismiss"];
    return action === "accept" ? dialog.accept(text) : dialog.dismiss();
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}#${hash}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  return { page, context, api, errors };
}

// 1. Nothing switched on: no provider buttons, no sign-in methods panel.
{
  const { page, context, errors } = await open({ providers: [] });
  ok(await page.isHidden("#auth-providers"), "no provider configured: no Continue with … buttons");
  ok(errors.length === 0, "no script errors with nothing configured");
  await context.close();
}
{
  const { page, context } = await open({ providers: [], available: [], identities: [] }, { signedIn: true });
  ok(await page.isHidden("#signin-methods"), "password only and no provider: no Sign-in methods panel");
  await context.close();
}
{
  const { page, context } = await open({ providers: ["google"], noIdentitiesApi: true }, { signedIn: true });
  ok(await page.isHidden("#signin-methods"), "server without /auth/identities: panel stays hidden");
  await context.close();
}

// 2. Google switched on: only its button shows; starting sends a hash of a secret kept in this tab.
let binding = "";
{
  const { page, context, api } = await open({ providers: ["google"] });
  ok(await page.isVisible('[data-provider="google"]'), "Google on: Continue with Google shows");
  ok(await page.isHidden('[data-provider="apple"]') && await page.isHidden('[data-provider="microsoft"]'), "providers that are off stay hidden");
  const secretBefore = await page.evaluate(() => sessionStorage.getItem("carewiseSignInSecret"));
  await Promise.all([page.waitForURL(/accounts\.google\.com/), page.click('[data-provider="google"]')]);
  binding = api.state.startBody?.binding || "";
  ok(/^[0-9a-f]{64}$/.test(binding) && api.state.startBody.platform === "web", "start sends only a 64-hex hash and the platform");
  ok(!secretBefore, "no secret existed before starting");
  ok(api.state.providerPage?.startsWith("https://accounts.google.com/"), "the browser goes to Google's own page");
  await context.close();
}
{
  const { page, context, api } = await open({ providers: ["google"], authorizationUrl: "https://evil.example/login" });
  await page.click('[data-provider="google"]');
  await page.waitForTimeout(500);
  ok(!api.state.providerPage && page.url().startsWith(base), "an unexpected sign-in address is never opened");
  ok(/couldn't open that sign-in/.test(await page.textContent("#auth-status")), "and a plain message is shown");
  await context.close();
}

// 3. Coming back with a one-time code finishes sign-in with the kept secret, then clears the address bar.
{
  const secret = "a".repeat(64);
  const { page, context, api, errors } = await open({ providers: ["google"] }, { hash: "signin-code=synthetic-one-time-code", secret });
  await page.waitForTimeout(800);
  ok(api.state.exchangeBody?.code === "synthetic-one-time-code" && api.state.exchangeBody?.secret === secret, "exchange sends the code and the tab's secret");
  ok(sha(api.state.exchangeBody?.secret || "") === sha(secret), "the secret matches the hash a start would have sent");
  ok(!(await page.evaluate(() => location.href)).includes("synthetic-one-time-code"), "the code is removed from the address bar");
  ok(await page.evaluate(() => localStorage.getItem("carewiseAuthToken")) === "synthetic-access", "signed in with the returned token");
  ok(/provider\.user@example\.com/.test(await page.textContent("#signed-in-label")), "shows who is signed in, from the server");
  ok(await page.evaluate(() => sessionStorage.getItem("carewiseSignInSecret")) === null, "the secret is used once and removed");
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();
}
{
  const { page, context, api } = await open({ providers: ["google"] }, { hash: "signin-code=link-from-someone-else" });
  await page.waitForTimeout(500);
  ok(!api.state.exchangeBody, "a code opened in a tab that never started sign-in is not used");
  ok(/took too long or was already used/.test(await page.textContent("#auth-status")), "and the person is asked to try again");
  await context.close();
}
{
  const { page, context, api } = await open({ providers: ["google"] }, { hash: "signin-error=cancelled", secret: "b".repeat(64) });
  await page.waitForTimeout(400);
  ok(/cancelled\. Nothing was changed/.test(await page.textContent("#auth-status")), "cancelling at the provider is explained");
  ok(!api.state.exchangeBody, "nothing is exchanged after a cancel");
  await context.close();
}
{
  const { page, context } = await open({ providers: ["google"], exchangeStatus: 409 }, { hash: "signin-code=c1", secret: "c".repeat(64) });
  await page.waitForTimeout(600);
  ok(/already linked to an account\. Sign in to that account first/.test(await page.textContent("#auth-status")), "an email that already has an account is explained, nothing merged");
  ok(!(await page.evaluate(() => localStorage.getItem("carewiseAuthToken"))), "and nobody is signed in");
  await context.close();
}
{
  const { page, context } = await open({ providers: ["google"], exchangeResponse: { access_token: "", two_factor_required: true, challenge: "synthetic-challenge" } }, { hash: "signin-code=c2", secret: "d".repeat(64) });
  await page.waitForTimeout(600);
  ok(await page.isVisible("#tf-login"), "two-step sign-in still asks for the code");
  await context.close();
}

// 4. Account → Sign-in methods.
{
  const identities = [{ id: "ident_g", provider: "google", email: "provider.user@gmail.example", created_at: "2026-11-01T00:00:00Z" }];
  const { page, context, api } = await open({ providers: ["google", "microsoft"], available: ["google", "microsoft"], identities }, { signedIn: true });
  ok(await page.isVisible("#signin-methods"), "signed in with a provider on: Sign-in methods shows");
  const list = await page.textContent("#signin-methods-list");
  ok(list.includes("Email and password") && list.includes("Google") && list.includes("provider.user@gmail.example"), "lists password and connected Google");
  ok(await page.isVisible('[data-signin-connect="microsoft"]') && await page.locator('[data-signin-connect="google"]').count() === 0, "offers to connect only providers not yet connected");

  page.dialogQueue.push(["accept"], ["dismiss"]);
  await page.click('[data-signin-remove="ident_g"]');
  await page.waitForTimeout(300);
  ok(!api.state.removeBody, "removal needs the password; cancelling the prompt removes nothing");

  page.dialogQueue.push(["accept"], ["accept", "synthetic-password-123"]);
  await page.click('[data-signin-remove="ident_g"]');
  await page.waitForTimeout(600);
  ok(api.state.removeBody?.password === "synthetic-password-123", "the password is sent to confirm removal");
  ok(!(await page.textContent("#signin-methods-list")).includes("provider.user@gmail.example"), "Google leaves the list");

  await Promise.all([page.waitForURL(/login\.microsoftonline\.com/), page.click('[data-signin-connect="microsoft"]')]);
  ok(api.state.calls.includes("POST /auth/oidc/microsoft/link-start"), "Connect Microsoft uses the signed-in link flow");
  await context.close();
}
{
  const identities = [{ id: "ident_only", provider: "apple", email: "x@privaterelay.appleid.com" }];
  const { page, context } = await open({ providers: ["apple"], available: ["apple"], identities, hasPassword: false, removeStatus: 409 }, { signedIn: true });
  page.dialogQueue.push(["accept"]);
  await page.click('[data-signin-remove="ident_only"]');
  await page.waitForTimeout(500);
  ok(/only way to sign in/.test(await page.textContent("#signin-methods-status")), "the last sign-in method can't be removed, and it says why");
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "fits a phone screen");
  await context.close();
}

await browser.close();
if (failures) { console.error(`${failures} provider sign-in check(s) failed`); process.exit(1); }
console.log("All provider sign-in checks passed");
