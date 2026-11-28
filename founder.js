// Founder metrics (22 Nov 2026). Reads GET /product/summary with the founder token and shows only
// measured numbers. Rules:
// - every card states what it counts, its source, its period and its limits;
// - anything not measured, or not connected (revenue, costs, support), says "No verified data available.";
// - nothing is estimated, sampled or filled in;
// - the token lives in this tab's memory only and is sent only to the API.
(function () {
  const NONE = "No verified data available.";
  const api = (() => {
    try { return localStorage.getItem("carewiseApiUrl") || "https://carewise-api.onrender.com"; } catch { return "https://carewise-api.onrender.com"; }
  })();
  const form = document.getElementById("fm-form");
  const status = document.getElementById("fm-status");
  const out = document.getElementById("fm-out");
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const COUNTS = "Anonymous daily counts sent by the website and app (POST /product/events)";
  const SINCE = "Since counting of this step began";
  const DAY_TOTALS = "Day totals across everyone, not people: one person can count several times, and nobody is tracked, so unique visitors cannot be counted. Off for Do Not Track and automated browsers.";
  const ACCOUNTS = "Accounts in the FollowThrough database";
  const NOT_CUSTOMERS = "Test accounts (reserved domains such as example.com, used by the nightly smoke test) and staff are left out.";

  function card(title, value, { def, source, period, limits }) {
    const missing = value === null || value === undefined;
    return `<article class="fm-card">
      <h3>${esc(title)}</h3>
      <p class="fm-value${missing ? " fm-none" : ""}">${missing ? NONE : esc(value)}</p>
      <dl><dt>Counts:</dt> <dd>${esc(def)}</dd><dt>Source:</dt> <dd>${esc(source)}</dd><dt>Period:</dt> <dd>${esc(period)}</dd><dt>Limits:</dt> <dd>${esc(limits)}</dd></dl>
    </article>`;
  }
  const section = (title, note, body) => `<section class="fm-section"><h2>${esc(title)}</h2>${note ? `<p>${esc(note)}</p>` : ""}${body}</section>`;
  // A count the API returned (0 included) is measured; a missing field is not.
  const measured = (obj, key) => (obj && typeof obj[key] === "number" ? obj[key] : null);

  const STEP_NAMES = {
    home_viewed: "Homepage opened", upload_started: "Report started", report_explained: "Report explained",
    source_line_viewed: "Opened a result's report line", doctor_brief_opened: "Doctor brief opened",
    report_saved: "Saved to an account", reminder_created: "Reminder created",
  };

  function render(data) {
    const people = data.people || {};
    const paid = data.paid || {};
    const totals = data.usage_totals || {};
    const ai = data.ai || {};
    const countingStarted = Object.keys(totals).length > 0;
    const usage = (name) => (countingStarted ? totals[name] || 0 : null);

    const peopleCards = [
      card("Customer accounts", measured(people, "customer_accounts"), { def: "Accounts created by people, all time.", source: ACCOUNTS, period: "All time", limits: `${NOT_CUSTOMERS} Excluded so far: ${people.excluded_test_or_staff_accounts ?? "unknown"}. Most people use FollowThrough without an account, so this undercounts users.` }),
      card("New accounts, last 7 days", measured(people, "new_last_7_days"), { def: "Customer accounts created in the last 7 days.", source: ACCOUNTS, period: "Last 7 days", limits: NOT_CUSTOMERS }),
      card("New accounts, last 30 days", measured(people, "new_last_30_days"), { def: "Customer accounts created in the last 30 days.", source: ACCOUNTS, period: "Last 30 days", limits: NOT_CUSTOMERS }),
      card("People with a saved report", measured(people, "with_a_saved_report"), { def: "Customer accounts with at least one report saved to the account.", source: "Saved reports in the database", period: "All time", limits: "Reports explained without saving stay on the device and are not counted here." }),
      card("Came back with another report", measured(people, "saved_reports_on_two_or_more_days"), { def: "Customer accounts that saved reports on two or more different days: the repeat-use signal.", source: "Saved reports in the database", period: "All time", limits: "Only people who save to an account. Lab tests are months apart, so this needs months to mean anything." }),
    ].join("");

    const funnel = Array.isArray(data.funnel) ? data.funnel : [];
    const funnelBody = funnel.length && funnel.some((row) => row.count)
      ? `<table class="fm-funnel"><thead><tr><th>Step</th><th>Count</th><th>Share of the step before</th></tr></thead><tbody>${funnel.map((row) => `<tr><td>${esc(STEP_NAMES[row.step] || row.step)}</td><td>${esc(row.count)}</td><td>${row.of_previous === null || row.of_previous === undefined ? "–" : `${esc(Math.round(row.of_previous * 1000) / 10)}%`}</td></tr>`).join("")}</tbody></table>`
      : `<p class="fm-value fm-none">${NONE}</p>`;

    const activityCards = [
      card("Values corrected by people", usage("value_corrected"), { def: "Times someone fixed a value the photo reader misread.", source: COUNTS, period: SINCE, limits: DAY_TOTALS }),
      card("Values checked against the report", countingStarted ? `${usage("value_confirmed")} match · ${usage("value_mismatch")} do not` : null, { def: "Answers to “Does this match your report?” on result cards. “Do not” is a misread the person found.", source: COUNTS, period: SINCE, limits: `${DAY_TOTALS} Only people who chose to answer; a misread nobody notices is not counted.` }),
      card("Doctor questions copied", usage("questions_copied"), { def: "Times the doctor questions were copied.", source: COUNTS, period: SINCE, limits: DAY_TOTALS }),
      card("Returning visits", usage("returning_visit"), { def: "Visits from a browser that was here on an earlier day.", source: COUNTS, period: SINCE, limits: `${DAY_TOTALS} Cleared browsers look new.` }),
      card("Interest in a paid plan", usage("plan_interest"), { def: "Clicks on Choose Plus or Choose Family. Not a purchase.", source: COUNTS, period: SINCE, limits: DAY_TOTALS }),
      card("Explanation marked helpful", data.helpful ? `${data.helpful.yes} yes · ${data.helpful.no} no` : null, { def: "Answers to “Was this explanation helpful?”", source: "Feedback saved by the API", period: "All time", limits: "Only people who chose to answer." }),
      card("Early access sign-ups", Array.isArray(data.early_access) ? data.early_access.length : null, { def: "People who asked to hear about early access, with consent.", source: "Early access list in the database", period: "All time", limits: "Interest, not use. Emails are not shown on this page." }),
    ].join("");

    const money = [
      card("Active paid subscriptions", measured(paid, "active_paid_subscriptions"), { def: "Customer accounts on Plus or Family with an active or past-due subscription.", source: "Subscriptions in the database (written by Stripe's webhook)", period: "Now", limits: "Test and staff accounts are left out." }),
      card("Revenue", null, { def: "Money received from customers.", source: paid.revenue_note || "Stripe", period: "—", limits: "Not connected here. Read it from Stripe's dashboard; it is never estimated." }),
      card("Direct costs", null, { def: "Hosting (Render), AI (Anthropic, OpenAI), payments (Stripe), calls (Twilio).", source: "The providers' invoices", period: "—", limits: "Not connected. Enter real invoices in docs/pricing-experiments.md." }),
      card("Gross margin", null, { def: "Revenue minus direct costs, divided by revenue.", source: "Revenue and direct costs above", period: "—", limits: "Needs both revenue and costs." }),
      card("Support requests", null, { def: "Questions and problems people sent in.", source: "None connected", period: "—", limits: "There is no support inbox connected to FollowThrough yet." }),
    ].join("");

    const aiState = ai.state === "ok" ? "Answering" : ai.state ? `Not answering (${ai.state})` : null;
    const aiCards = card("AI Health Guide", aiState, { def: "Whether the online helper can answer right now: key accepted and model available.", source: "GET /assistant/status, checked live at most every 5 minutes", period: ai.checked_at ? `Checked ${ai.checked_at}` : "Now", limits: "A live check of the provider, not a test of answer quality." });

    out.innerHTML = [
      section("People", "Accounts only. Most people explain reports without an account, so these are lower bounds.", `<div class="fm-grid">${peopleCards}</div>`),
      section("Core workflow", "Anonymous day totals for each step, in order. Read the shares as a rough guide, not per-person conversion.", funnelBody),
      section("What people do", "", `<div class="fm-grid">${activityCards}</div>`),
      section("Money", "Only measured numbers appear here. Nothing is projected.", `<div class="fm-grid">${money}</div>`),
      section("Reliability", "", `<div class="fm-grid">${aiCards}</div>`),
    ].join("");
    out.hidden = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = document.getElementById("fm-token").value.trim();
    status.textContent = "Loading…";
    out.hidden = true;
    try {
      const response = await fetch(`${api}/product/summary`, { headers: { "X-Founder-Token": token } });
      if (response.status === 401) { status.textContent = "That token was not accepted."; return; }
      if (response.status === 404) { status.textContent = "The founder summary is switched off: CAREWISE_FOUNDER_TOKEN is not set in Render."; return; }
      if (!response.ok) { status.textContent = `The API answered ${response.status}. Try again shortly (a sleeping free-plan server can take a minute to wake).`; return; }
      render(await response.json());
      status.textContent = `Loaded ${new Date().toLocaleString()}.`;
    } catch {
      status.textContent = "Could not reach the API. It may be waking up; try again in a minute.";
    }
  });
})();
