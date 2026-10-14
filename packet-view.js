// Patient view of a DocBridge packet: the clinician-approved explanation of their lab.
// The token stays in the URL hash and is sent to the API in a POST body.
(() => {
  const DEFAULT_API = "https://carewise-api.onrender.com";
  let api = DEFAULT_API;
  try {
    api = localStorage.getItem("carewiseApiUrl") || DEFAULT_API;
  } catch {
    api = DEFAULT_API;
  }
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const date = (value) => {
    const d = new Date(value && value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  };
  const fail = (message) => {
    $("sv-loading").hidden = true;
    $("sv-error").hidden = false;
    if (message) $("sv-error-text").textContent = message;
  };

  function render(p) {
    $("pv-clinic").textContent = p.clinic_name || "Your clinic";
    const flagged = (p.markers || []).filter((m) => /high|low|above|below|attention/i.test(m.status || "") && !/in range/i.test(m.status || ""));
    $("sv-summary").innerHTML = `
      <section class="sv-card sv-hero">
        <p class="sv-eyebrow">Your lab results${p.lab_date ? ` · ${esc(date(p.lab_date))}` : ""}</p>
        <h1>Your results, explained</h1>
        <p class="sv-muted">Reviewed and approved by ${esc(p.approved_by_name || "your clinician")}${p.approved_at ? ` on ${esc(date(p.approved_at))}` : ""}.</p>
      </section>
      <section class="sv-card"><div class="pv-letter">${esc(p.summary).replace(/\n/g, "<br>")}</div></section>
      ${(p.markers || []).length ? `<section class="sv-card"><h2>Your numbers</h2><div class="sv-table"><table><tr><th>Test</th><th>Result</th><th>Usual range</th></tr>${p.markers.map((m) => `<tr${flagged.includes(m) ? ' class="pv-out"' : ""}><td>${esc(m.name)}</td><td>${esc(`${m.value} ${m.unit || ""}`.trim())}${flagged.includes(m) ? '<br><b class="pv-flag">Outside range</b>' : ""}</td><td>${esc(m.range || "—")}</td></tr>`).join("")}</table></div></section>` : ""}
      ${(p.questions || []).length ? `<section class="sv-card"><h2>Good questions for your visit</h2><ol>${p.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></section>` : ""}`;
    $("sv-loading").hidden = true;
    $("sv-summary").hidden = false;
    $("sv-print").hidden = false;
    if (p.questions_enabled) setupQuestions(flagged);
  }

  // ----- Follow-up questions, answered only from this approved summary and the patient's own labs -----
  let token = "";

  function citationLabel(id) {
    const para = id.match(/^summary:paragraph_(\d+)$/);
    if (para) return `Your summary, part ${para[1]}`;
    const lab = id.match(/^lab:(.+):([^:]+)$/);
    if (lab) return `${lab[1]}${lab[2] !== "undated" ? `, ${date(lab[2]) || lab[2]}` : ""}`;
    return id;
  }

  function addAnswer(question, body) {
    const item = document.createElement("div");
    item.className = `pv-qa-item${body.deflect_to_doctor ? " pv-qa-deflect" : ""}`;
    item.innerHTML = `<p class="pv-qa-q">${esc(question)}</p><p>${esc(body.answer)}</p>${(body.citations || []).length ? `<p class="pv-qa-cite">From: ${body.citations.map((c) => `<span>${esc(citationLabel(c))}</span>`).join(" ")}</p>` : ""}`;
    $("pv-qa-list").prepend(item);
  }

  async function askQuestion(question) {
    const text = question.trim();
    if (text.length < 2) return;
    const status = $("pv-qa-status");
    status.textContent = "Looking at your results…";
    $("pv-qa-send").disabled = true;
    try {
      const response = await fetch(`${api}/clinics/packets/qa`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, question: text }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = typeof body.detail === "string" ? body.detail : "We couldn't answer right now. Please ask your care team.";
        return;
      }
      addAnswer(text, body);
      $("pv-qa-input").value = "";
      status.textContent = "";
    } catch {
      status.textContent = "We couldn't reach FollowThrough Health. Check your connection and try again.";
    } finally {
      $("pv-qa-send").disabled = false;
    }
  }

  async function setupQuestions(flagged) {
    try {
      const features = await (await fetch(`${api}/features`)).json();
      if (!features.patient_qa) return;
    } catch {
      return;
    }
    const first = flagged[0]?.name?.replace(/\s*\(.*\)$/, "");
    const chips = [first ? `What does a high or low ${first} mean?` : "What do these numbers mean?", "What should I ask my doctor?", "Is this better than last time?"];
    const section = document.createElement("section");
    section.className = "sv-card pv-qa";
    section.innerHTML = `<h2>Questions about your results</h2>
      <p class="sv-muted">Answers come only from the summary your clinician approved and your own lab numbers. They are not medical advice. For diagnosis or treatment, ask your doctor.</p>
      <div class="pv-qa-chips">${chips.map((c) => `<button type="button" class="pv-qa-chip">${esc(c)}</button>`).join("")}</div>
      <form id="pv-qa-form" class="pv-qa-form"><label for="pv-qa-input" class="pv-sr">Your question</label><input id="pv-qa-input" type="text" maxlength="500" placeholder="Type a question about these results" autocomplete="off" /><button id="pv-qa-send" type="submit">Ask</button></form>
      <p id="pv-qa-status" class="sv-muted" role="status"></p>
      <div id="pv-qa-list"></div>`;
    $("sv-summary").appendChild(section);
    section.querySelectorAll(".pv-qa-chip").forEach((chip) => chip.addEventListener("click", () => askQuestion(chip.textContent)));
    $("pv-qa-form").addEventListener("submit", (event) => { event.preventDefault(); askQuestion($("pv-qa-input").value); });
  }

  async function load() {
    token = new URLSearchParams(window.location.hash.slice(1)).get("t") || "";
    if (token.length < 20) return fail("This link is incomplete. Please ask your clinic to send it again.");
    try {
      const response = await fetch(`${api}/clinics/packets/view`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (response.status === 429) return fail("Too many attempts. Please wait a few minutes and try again.");
      if (!response.ok) return fail();
      render(await response.json());
    } catch {
      fail("We couldn't reach FollowThrough Health. Check your connection and refresh the page.");
    }
  }

  $("sv-print").addEventListener("click", () => window.print());
  load();
})();
