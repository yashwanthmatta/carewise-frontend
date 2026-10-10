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
  }

  async function load() {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("t") || "";
    if (token.length < 20) return fail("This link is incomplete. Please ask your clinic to send it again.");
    try {
      const response = await fetch(`${api}/clinics/packets/view`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (response.status === 429) return fail("Too many attempts. Please wait a few minutes and try again.");
      if (!response.ok) return fail();
      render(await response.json());
    } catch {
      fail("We couldn't reach CareWise. Check your connection and refresh the page.");
    }
  }

  $("sv-print").addEventListener("click", () => window.print());
  load();
})();
