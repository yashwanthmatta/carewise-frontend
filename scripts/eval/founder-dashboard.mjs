// Founder metrics page (22 Nov 2026), with made-up API answers only. Checks:
// - every card says what it counts, its source, period and limits;
// - revenue, costs, margin and support say "No verified data available." (never estimated);
// - an empty database shows no invented numbers, and no counting yet means no funnel;
// - the token is never stored in the browser, and the page is not indexed;
// - a wrong token is explained; fits a 390px screen.
// Usage: serve the site on :4173, then node scripts/eval/founder-dashboard.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };
const NONE = "No verified data available.";

const EMPTY = { people: { customer_accounts: 0, new_last_7_days: 0, new_last_30_days: 0, excluded_test_or_staff_accounts: 3, with_a_saved_report: 0, saved_reports_on_two_or_more_days: 0 }, paid: { active_paid_subscriptions: 0, by_plan: {}, revenue: null, revenue_note: "Not stored by FollowThrough; Stripe's dashboard is the source of truth." }, ai: { state: "provider_auth_rejected", checked_at: "2026-11-22T21:00:00+00:00" }, usage_totals: {}, funnel: [{ step: "home_viewed", count: 0, of_previous: null }], helpful: { yes: 0, no: 0 }, comments: [], early_access: [] };
const SOME = { ...EMPTY, people: { ...EMPTY.people, customer_accounts: 4, with_a_saved_report: 2, saved_reports_on_two_or_more_days: 1 }, ai: { state: "ok" }, usage_totals: { home_viewed: 40, upload_started: 20, report_explained: 15, value_corrected: 2 }, funnel: [{ step: "home_viewed", count: 40, of_previous: null }, { step: "upload_started", count: 20, of_previous: 0.5 }, { step: "report_explained", count: 15, of_previous: 0.75 }] };

const browser = await chromium.launch();
for (const [size, width] of [["desktop", 1280], ["phone", 390]]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
  await context.route(/fonts\./, (route) => route.abort());
  let answer = { status: 200, body: EMPTY };
  const tokensSent = [];
  await context.route("**/product/summary", (route) => {
    tokensSent.push(route.request().headers()["x-founder-token"]);
    return route.fulfill({ status: answer.status, contentType: "application/json", body: JSON.stringify(answer.body) });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}founder.html`, { waitUntil: "load" });
  check(/noindex/.test(await page.getAttribute('meta[name="robots"]', "content")), `${size}: the page asks search engines not to index it`);

  const load = async (body, status = 200) => {
    answer = { status, body };
    await page.fill("#fm-token", "synthetic-founder-token");
    await page.click("#fm-form button");
    await page.waitForFunction(() => !/Loading/.test(document.getElementById("fm-status").textContent));
  };

  await load(EMPTY);
  const empty = await page.innerText("#fm-out");
  check(tokensSent.at(-1) === "synthetic-founder-token", `${size}: the token is sent in the X-Founder-Token header`);
  const cards = await page.$$eval(".fm-card", (els) => els.map((el) => ({ title: el.querySelector("h3").textContent, value: el.querySelector(".fm-value").textContent, terms: [...el.querySelectorAll("dt")].map((dt) => dt.textContent) })));
  check(cards.length >= 15 && cards.every((c) => ["Counts:", "Source:", "Period:", "Limits:"].every((t) => c.terms.includes(t))), `${size}: every card states counts, source, period and limits (${cards.length} cards)`);
  for (const title of ["Revenue", "Direct costs", "Gross margin", "Support requests"]) {
    check(cards.find((c) => c.title === title)?.value === NONE, `${size}: ${title} says "${NONE}"`);
  }
  check(cards.find((c) => c.title === "Customer accounts")?.value === "0", `${size}: an empty database shows a measured 0, not an invented number`);
  check(cards.find((c) => c.title === "Returning visits")?.value === NONE, `${size}: before counting starts, usage cards say no verified data`);
  check(/Core workflow[\s\S]*No verified data available/.test(empty), `${size}: no funnel is drawn when nothing was counted`);
  check(/Not answering \(provider_auth_rejected\)/.test(empty), `${size}: the AI card shows the live failure plainly`);
  check(!/fastmail|@/.test(empty), `${size}: no email addresses on the page`);

  await load(SOME);
  const rows = await page.$$eval(".fm-funnel tbody tr", (trs) => trs.map((tr) => tr.innerText.replace(/\s+/g, " ")));
  check(rows.length === 3 && /Report started 20 50%/.test(rows[1]), `${size}: the funnel shows counts and shares (${rows.join(" | ")})`);
  check((await page.$$eval(".fm-card", (els) => els.find((el) => /Revenue/.test(el.textContent)).querySelector(".fm-value").textContent)) === NONE, `${size}: revenue stays unknown even with activity`);

  await load({ detail: "Founder token required." }, 401);
  check(/not accepted/.test(await page.textContent("#fm-status")), `${size}: a wrong token is explained`);
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  check(!/synthetic-founder-token/.test(stored), `${size}: the token is never stored in the browser`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  check(!errors.length, `${size}: no script errors ${errors.join("; ")}`);
  await context.close();
}
await browser.close();
if (failed) { console.log(`${failed} founder dashboard check(s) failed`); process.exit(1); }
console.log("All founder dashboard checks passed");
