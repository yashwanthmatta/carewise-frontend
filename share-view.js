// Doctor's view of a "Share with my doctor" link. The token lives in the URL hash, so
// it is never sent to the website server; it goes to the API in a POST body.
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
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  };

  function fail(message) {
    $("sv-loading").hidden = true;
    $("sv-error").hidden = false;
    if (message) $("sv-error-text").textContent = message;
  }

  function list(items, render) {
    return items && items.length ? `<ul>${items.map(render).join("")}</ul>` : "<p class=\"sv-muted\">None recorded.</p>";
  }

  function render(data) {
    const s = data.snapshot || {};
    const person = s.person && s.person !== "Me" ? s.person : "";
    const history = s.history || {};
    const historyItem = (item) => `<li>${esc(item.name)}${item.start ? ` <span class="sv-muted">(since ${esc(item.start)})</span>` : ""}${item.notes ? `: ${esc(item.notes)}` : ""}</li>`;
    const hasHistory = ["conditions", "medicines", "did_not_suit"].some((key) => (history[key] || []).length);
    const html = `
      <section class="sv-card sv-hero">
        <p class="sv-eyebrow">Shared lab summary${data.label ? ` · ${esc(data.label)}` : ""}</p>
        <h1>${person ? `Lab summary for ${esc(person)}` : "Patient lab summary"}</h1>
        <p class="sv-muted">Prepared by ${esc(s.prepared_by || "the patient")} with CareWise on ${esc(date(s.created_at || data.created_at))}. Link works until ${esc(date(data.expires_at))}.</p>
        ${s.score != null ? `<p class="sv-score"><strong>${esc(s.score)}</strong>/100 <span class="sv-muted">educational estimate</span></p>` : ""}
        ${s.next_step ? `<p class="sv-next">${esc(s.next_step)}</p>` : ""}
      </section>
      ${(s.findings || []).length ? `<section class="sv-card"><h2>Discussion points</h2>${list(s.findings, (f) => `<li><b>${esc(f.label)}:</b> ${esc(f.level)}. ${esc(f.detail)}</li>`)}</section>` : ""}
      ${(s.values || []).length ? `<section class="sv-card"><h2>Values detected in the report</h2><div class="sv-table"><table><tr><th>Test</th><th>Value</th><th>Note</th></tr>${s.values.map((v) => `<tr><td>${esc(v.label)}</td><td>${esc(`${v.value} ${v.unit}`.trim())}</td><td>${esc(v.flag)}</td></tr>`).join("")}</table></div></section>` : ""}
      ${(s.panel || []).length ? `<section class="sv-card"><h2>All tests on the report</h2><div class="sv-table"><table><tr><th>Test</th><th>Result</th><th>Lab range</th><th>Status</th></tr>${s.panel.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.result)}</td><td>${esc(p.range || "not printed")}</td><td>${esc(p.status)}</td></tr>`).join("")}</table></div></section>` : ""}
      ${s.scan ? `<section class="sv-card"><h2>Imaging report (${esc(s.scan.modality)})</h2><p class="sv-muted">Explained from the radiologist's text only; CareWise does not read images.</p>${(s.scan.follow_ups || []).length ? `<p>Lines the family would like to discuss:</p>${list(s.scan.follow_ups, (line) => `<li>“${esc(line)}”</li>`)}` : "<p>No follow-up lines were flagged.</p>"}</section>` : ""}
      ${hasHistory ? `<section class="sv-card"><h2>Health history (entered by the family)</h2><div class="sv-grid"><div><h3>Ongoing conditions</h3>${list(history.conditions, historyItem)}</div><div><h3>Current medicines</h3>${list(history.medicines, historyItem)}</div><div><h3>Did not suit them</h3>${list(history.did_not_suit, historyItem)}</div></div></section>` : ""}
      ${(s.questions || []).length ? `<section class="sv-card"><h2>Questions from the family</h2><ol>${s.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></section>` : ""}`;
    $("sv-loading").hidden = true;
    $("sv-summary").innerHTML = html;
    $("sv-summary").hidden = false;
    $("sv-print").hidden = false;
  }

  async function load() {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("t") || "";
    if (token.length < 20) {
      fail("This link is incomplete. Ask the family to send it again.");
      return;
    }
    try {
      const response = await fetch(`${api}/shares/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.status === 429) {
        fail("Too many attempts. Please wait a few minutes and try again.");
        return;
      }
      if (!response.ok) {
        fail();
        return;
      }
      render(await response.json());
    } catch {
      fail("CareWise could not be reached. Check the connection and refresh the page.");
    }
  }

  $("sv-print").addEventListener("click", () => window.print());
  load();
})();
