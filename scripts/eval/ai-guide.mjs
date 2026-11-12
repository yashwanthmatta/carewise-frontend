// AI Health Guide (2026-11-09): the homepage guide answers through the same pipeline as the help chat.
// Checks its label, avatar states, safety answers (emergency words, "are you a doctor",
// diagnosis, medicine), the online answer path (the real /assistant/chat endpoint, mocked here)
// and the built-in answers when the server is not reachable, reduced motion, and phone layout.
// Optional: AXE_PATH=/path/to/axe.min.js runs an accessibility scan of the guide.
// Usage: serve the site on :4173, then node scripts/eval/ai-guide.mjs
import fs from "node:fs";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
const base = process.env.CAREWISE_EVAL_URL || "http://localhost:4173/";
let failed = 0;
const check = (ok, label) => { if (!ok) failed += 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };

const browser = await chromium.launch();
async function open({ viewport = { width: 1280, height: 900 }, online = false, reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion, serviceWorkers: "block", bypassCSP: Boolean(process.env.AXE_PATH) });
  await context.route(/fonts\.|jsdelivr/, (route) => route.abort());
  const seen = [];
  await context.route(/onrender\.com/, async (route) => {
    const url = route.request().url();
    if (online && url.includes("/assistant/chat")) {
      seen.push(JSON.parse(route.request().postData() || "{}"));
      await new Promise((resolve) => setTimeout(resolve, 300));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "eGFR estimates how well the kidneys filter blood. Ask your doctor what yours means for you." }) });
    }
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.careWiseGuideAsk === "function");
  return { context, page, errors, seen };
}
const lastAnswer = (page) => page.evaluate(() => {
  const all = [...document.querySelectorAll(".guide-msg-guide:not(.guide-pending)")];
  return all.length > 1 ? all[all.length - 1].querySelector("p").innerText : "";
});
async function askAndWait(page, question) {
  const before = await page.$$eval(".guide-msg-guide .guide-source", (list) => list.length);
  await page.fill("#guide-input", question);
  await page.click('[data-guide-form] button[type="submit"]');
  await page.waitForFunction((count) => document.querySelectorAll(".guide-msg-guide .guide-source").length > count, before, { timeout: 15000 });
  return lastAnswer(page);
}

// 1. Label, states and safety, with the server not reachable (built-in answers).
{
  const { context, page, errors } = await open();
  check(/AI Health Guide — Educational information, not medical diagnosis\./.test(await page.innerText("#guide")), "label: AI Health Guide — Educational information, not medical diagnosis.");
  check(await page.getAttribute("[data-guide-avatar]", "data-state") === "idle", "avatar starts idle");
  await page.focus("#guide-input");
  await page.keyboard.type("What");
  check(await page.getAttribute("[data-guide-avatar]", "data-state") === "listening", "typing: avatar listens");
  await page.fill("#guide-input", "");
  const states = [];
  await page.exposeFunction("recordState", (state) => states.push(state));
  await page.evaluate(() => new MutationObserver(() => window.recordState(document.querySelector("[data-guide-avatar]").dataset.state)).observe(document.querySelector("[data-guide-avatar]"), { attributes: true, attributeFilter: ["data-state"] }));
  const egfr = await askAndWait(page, "What does eGFR mean?");
  check(/kidney/i.test(egfr), `built-in answer explains eGFR ("${egfr.slice(0, 60)}…")`);
  check(states.includes("thinking") && states.includes("speaking") && states[states.length - 1] === "idle", `avatar goes thinking → speaking → idle (${[...new Set(states)].join(", ")})`);
  check(/built-in explanations/.test(await page.innerText(".guide-msg-guide:last-child .guide-source")), "answer names its source");
  const doctor = await askAndWait(page, "Are you a real doctor?");
  check(/^No\./.test(doctor) && /not a doctor/.test(doctor), "\"Are you a real doctor?\": says it is not a doctor");
  const diagnose = await askAndWait(page, "Do I have diabetes?");
  check(/can't diagnose/.test(diagnose), "\"Do I have diabetes?\": says it can't diagnose");
  const medicine = await askAndWait(page, "What dose of metformin should I take?");
  check(/can't recommend or name medicines/.test(medicine) && !/\b\d+\s?mg\b/i.test(medicine), "medicine dose question: no medicine or dose suggested");
  const urgent = await askAndWait(page, "I have chest pain right now");
  check(/call 911 or your local emergency number/i.test(urgent) && await page.$(".guide-msg-guide.guide-urgent"), "emergency words: urgent message, shown as urgent");
  check(await page.$$eval("[data-guide-copy]", (list) => list.length) >= 5, "every answer has Copy");
  check(!errors.length, `no script errors ${errors.join("; ")}`);
  await context.close();
}

// 2. Online: the question goes to the real chat endpoint, and the answer says where it came from.
{
  const { context, page, seen } = await open({ online: true });
  const answer = await askAndWait(page, "What does eGFR mean?");
  check(/estimates how well the kidneys filter/.test(answer), "online answer from /assistant/chat is shown");
  check(seen.length === 1 && seen[0].messages?.at(-1)?.content === "What does eGFR mean?" && seen[0].report_summary === "", "sends the question and no report unless the person chooses");
  check(/Anthropic/.test(await page.innerText(".guide-msg-guide:last-child .guide-source")), "online answer names the AI provider");
  // Emergency words never reach the server.
  await askAndWait(page, "I can't breathe");
  check(seen.length === 1, "emergency words are answered on the device, not sent");
  await context.close();
}

// 3. Own report: the "include my latest report" choice appears only after a report is explained,
//    and when chosen, the report summary is sent with the question.
{
  const { context, page, seen } = await open({ online: true });
  check(await page.$eval("[data-guide-share]", (el) => el.hidden), "no report: no option to include one");
  await page.evaluate(() => { location.hash = "#report-title"; });
  await page.fill("#report-text", "Sample Lab\nCreatinine 2.3 H mg/dL 0.6-1.3");
  await page.click("#analyze-report");
  await page.waitForSelector("#report-results .report-summary", { state: "attached", timeout: 15000 });
  await page.evaluate(() => { location.hash = "#home-title"; });
  await page.waitForFunction(() => !document.querySelector("[data-guide-share]").hidden, null, { timeout: 5000 }).catch(() => {});
  check(!(await page.$eval("[data-guide-share]", (el) => el.hidden)), "after explaining a report: option to include it appears");
  await page.check("[data-guide-share] input");
  await askAndWait(page, "What does my creatinine mean?");
  check(/Creatinine/i.test(seen.at(-1)?.report_summary || ""), "when chosen, the report summary is sent with the question");
  await context.close();
}

// 4. Phone layout, reduced motion and accessibility.
for (const [size, viewport] of [["phone", { width: 375, height: 740 }], ["desktop", { width: 1280, height: 900 }]]) {
  const { context, page } = await open({ viewport, reducedMotion: "reduce" });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${size}: no sideways scroll`);
  const box = await page.$eval(".guide-figure", (svg) => { const r = svg.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  check(box.w > 150 && box.w <= viewport.width, `${size}: avatar is drawn at a sensible size (${Math.round(box.w)} px wide)`);
  const animation = await page.$eval(".guide-avatar .guide-body", (el) => getComputedStyle(el).animationName);
  check(animation === "none", `${size}: reduced motion stops the avatar's movement (${animation})`);
  check(/Ready for your question/.test(await page.innerText("[data-guide-state]")), `${size}: the state is also written in words`);
  if (process.env.AXE_PATH) {
    await page.addScriptTag({ content: fs.readFileSync(process.env.AXE_PATH, "utf8") });
    const violations = await page.evaluate(async () => (await axe.run({ include: [["#guide"]] })).violations.map((v) => `${v.id} (${v.nodes.length})`));
    check(!violations.length, `${size}: axe ${violations.length ? violations.join(", ") : "no violations"}`);
  }
  await context.close();
}

await browser.close();
if (failed) { console.log(`${failed} AI Health Guide check(s) failed`); process.exit(1); }
console.log("All AI Health Guide checks passed");
