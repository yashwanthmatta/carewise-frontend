// DocBridge (FollowThrough Health for doctors): draft a patient-ready lab explanation on this
// device, let a named clinician edit and approve it, then hand the patient a private
// link. Loaded after script.js and uses its helpers (apiGet, apiPost, apiPut, authToken,
// extractPdfText, analyzeReportTextLocally, labTestInfo, escapeHtml, SAMPLE text).

(() => {
  const panel = document.querySelector(".docbridge-panel");
  if (!panel) return;
  const $ = (id) => document.getElementById(id);
  const statusLine = $("db-status");
  let clinic = null;
  let current = null; // { packetId, markers, patientRef, startedAt }

  const SAMPLE_LAB = [
    "Comprehensive panel, collected 2026-10-01",
    "LDL cholesterol 148 mg/dL (ref <100) H",
    "HDL cholesterol 44 mg/dL (ref >40)",
    "Triglycerides 168 mg/dL (ref <150) H",
    "Hemoglobin A1c 5.8 % (ref 4.0-5.6) H",
    "Glucose 102 mg/dL 70-99 H",
    "Creatinine 0.9 mg/dL 0.6-1.2",
    "TSH 2.1 mIU/L 0.4-4.0",
  ].join("\n");

  // Plain-English meaning for the tests the main reader handles itself.
  const EXTRA_MEANING = [
    [/ldl/i, "The \"bad\" cholesterol that can build up in blood vessels over time."],
    [/total cholesterol/i, "All the cholesterol in your blood added together."],
    [/triglycer/i, "A type of fat in the blood that rises with sugar, alcohol and large meals."],
    [/a1c/i, "Your average blood sugar over the last 2 to 3 months."],
    [/blood pressure/i, "How hard blood pushes on your artery walls."],
    [/vitamin d/i, "A vitamin that helps keep bones and muscles strong."],
  ];
  const RANGE_RE = /(?:ref(?:erence)?(?:\s*range)?:?\s*)?([<>≤≥]=?\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?)/i;

  // The range the lab printed on the same line, if any (never guessed).
  function printedRange(text, label) {
    const word = label.toLowerCase().includes("a1c") ? "a1c" : label.split(/[\s(]/)[0].toLowerCase();
    const line = text.split("\n").find((row) => row.toLowerCase().includes(word));
    if (!line) return "";
    const afterValue = line.replace(/^[^\d<>]*\d+(?:\.\d+)?/, "");
    return afterValue.match(RANGE_RE)?.[1]?.replace(/\s+/g, "") || "";
  }

  const say = (text) => { statusLine.textContent = text; };
  const today = () => new Date().toISOString().slice(0, 10);

  function show(view) {
    $("db-signin").hidden = view !== "signin";
    $("db-setup").hidden = view !== "setup";
    $("db-workspace").hidden = view !== "workspace";
  }

  async function load() {
    if (!authToken) {
      clinic = null;
      show("signin");
      return;
    }
    try {
      clinic = await apiGet("/clinics/me");
      $("db-badge").textContent = `${clinic.name} · Pilot`;
      show("workspace");
      if (!$("db-lab-date").value) $("db-lab-date").value = today();
      $("db-intake").hidden = !clinic.intake_address;
      $("db-intake-address").textContent = clinic.intake_address || "";
      refresh();
      loadTeam();
      fillSettings();
      resetIdle();
    } catch (error) {
      clinic = null;
      show(/404/.test(String(error?.message)) ? "setup" : "signin");
    }
  }

  async function refresh() {
    if (!clinic) return;
    try {
      const [packets, metrics] = await Promise.all([apiGet(`/clinics/${clinic.id}/packets`), apiGet(`/clinics/${clinic.id}/metrics`)]);
      renderMetrics(metrics);
      renderList(packets);
    } catch {
      say("Could not load the inbox. Check your connection and refresh.");
    }
  }

  function renderMetrics(m) {
    const review = m.median_review_seconds == null ? "–" : m.median_review_seconds < 120 ? `${m.median_review_seconds}s` : `${Math.round(m.median_review_seconds / 60)} min`;
    $("db-metrics").innerHTML = [
      ["Waiting for review", m.drafts + (m.manual_review || 0)],
      ["Need a call", m.needs_call],
      ["Approved this week", m.approved_this_week],
      ["Median review time", review],
      ["Patients who opened", m.patients_opened],
    ].map(([label, value]) => `<div><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  }

  const STATUS_LABEL = { new: "New from email, open to draft", draft: "Waiting for review", manual_review: "Needs manual review", needs_call: "Needs a call", approved: "Approved", rejected: "Rejected, not sent" };
  const canApprove = () => clinic && (clinic.member_role === "owner" || clinic.member_role === "clinician");

  // Billing codes for common lab panels, as a reference for the front desk only.
  const LAB_CODES = [
    [/ldl|hdl|triglycer|total cholesterol|non-hdl/i, "80061", "Lipid panel"],
    [/a1c/i, "83036", "Hemoglobin A1c"],
    [/white blood|red blood|hemoglobin$|hematocrit|platelet|mcv|neutrophil|lymphocyte/i, "85025", "Complete blood count (CBC) with differential"],
    [/alt|ast|albumin|bilirubin|alkaline phosphatase|total protein/i, "80053", "Comprehensive metabolic panel"],
    [/tsh/i, "84443", "TSH"],
    [/vitamin d/i, "82306", "Vitamin D, 25-hydroxy"],
    [/ferritin/i, "82728", "Ferritin"],
    [/vitamin b12/i, "82607", "Vitamin B12"],
    [/psa/i, "84153", "PSA, total"],
    [/crp/i, "86140", "C-reactive protein"],
  ];

  function coverageBlock(markers) {
    const codes = [];
    LAB_CODES.forEach(([re, code, name]) => {
      if (markers.some((m) => re.test(m.name)) && !codes.some((c) => c.code === code)) codes.push({ code, name });
    });
    if (!codes.length) return "";
    return `<h5>Coverage and cost check (educational)</h5>
      <p class="db-muted">Common billing codes if these tests are repeated. Confirm codes with your billing team and coverage with the patient's insurer. Not a price quote.</p>
      <ul>${codes.map((c) => `<li>${escapeHtml(c.name)}: CPT ${escapeHtml(c.code)}</li>`).join("")}</ul>
      <ul class="db-muted"><li>Confirm the lab is in the patient's network before booking.</li><li>Some plans limit how often screening tests are covered, so check before reordering.</li><li>For cash-pay patients, ask the lab for its self-pay price list.</li></ul>`;
  }

  function agendaBlock(flaggedCount, questionCount, changeCount) {
    const items = [
      `2 min · Results: ${flaggedCount ? `${flaggedCount} outside the usual range` : "nothing outside the usual range"}${changeCount ? `, ${changeCount} changed since last time` : ""}`,
      `3 min · Patient questions${questionCount ? ` (${questionCount} likely)` : ""}`,
      "2 min · Next steps and when to recheck",
    ];
    return `<h5>Suggested visit agenda</h5><ol>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`;
  }

  function renderList(packets) {
    if (!packets.length) {
      $("db-list").innerHTML = "<p>No labs yet. Add one above, or try the sample lab.</p>";
      return;
    }
    $("db-list").innerHTML = packets.map((p) => `
      <article class="db-row db-row-${escapeHtml(p.status)}">
        <div>
          <strong>${escapeHtml(p.patient_ref)}</strong>
          <span>${escapeHtml(p.lab_date || "No date")} · ${escapeHtml(STATUS_LABEL[p.status] || p.status)}${p.status === "approved" ? ` by ${escapeHtml(p.approved_by_name)}${p.edited === false ? " as drafted" : p.edited ? " with edits" : ""}${p.patient_viewed ? " · opened by patient" : ""}` : ""}</span>
        </div>
        <div class="db-row-actions">
          ${p.status !== "approved" && p.status !== "rejected" ? `<button class="secondary-button compact" type="button" data-db-open="${escapeHtml(p.id)}">Review</button>` : ""}
          <button class="text-button" type="button" data-db-audit="${escapeHtml(p.id)}">History</button>
          <button class="text-button" type="button" data-db-visit="${escapeHtml(p.patient_ref)}">Visit summary</button>
        </div>
      </article>`).join("");
    $("db-list").dataset.packets = JSON.stringify(packets);
  }

  // ----- Drafting on this device -----
  function markersFrom(analysis, text) {
    const markers = [];
    (analysis.labValues || []).forEach((item) => {
      const range = printedRange(text, item.label);
      const status = item.flag === "In range discussion" ? "In range" : item.flag || "";
      markers.push({ name: item.label, value: String(item.value), unit: item.unit || "", range, status, low_confidence: !range });
    });
    (analysis.panelResults || []).forEach((item) => {
      if (markers.some((m) => m.name.toLowerCase() === item.name.toLowerCase())) return;
      const status = { above: "High", below: "Low", within: "In range", unknown: "No range" }[item.status] || item.status;
      markers.push({ name: item.name, value: String(item.valueText), unit: item.unit || "", range: item.rangeText || "", status, low_confidence: Boolean(item.generalRange || !item.rangeText) });
    });
    return markers.slice(0, 80);
  }

  function isFlagged(marker) {
    return /high|low|attention|above|below|review|important|tracking/i.test(marker.status) && !/in range|better/i.test(marker.status);
  }

  function draftText(analysis, markers, labDate) {
    const formal = clinic?.tone === "formal";
    const flagged = markers.filter(isFlagged);
    const fine = markers.filter((m) => !isFlagged(m));
    const date = labDate ? new Date(`${labDate}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "your recent visit";
    const lines = [];
    lines.push(formal ? `Dear patient,\n\nBelow is a plain-language summary of your laboratory results from ${date}.` : `Hi,\n\nHere are your lab results from ${date}, explained in plain words.`);
    if (fine.length) lines.push(`\nGood news: ${fine.length} of your ${markers.length} results are in the usual range${fine.length <= 4 ? ` (${fine.map((m) => m.name).join(", ")})` : ""}.`);
    if (flagged.length) {
      lines.push(`\n${formal ? "Results outside the usual range:" : "A few results are outside the usual range:"}`);
      flagged.forEach((m) => {
        const key = (analysis.panelResults || []).find((p) => p.name === m.name)?.key;
        const what = key ? labTestInfo(key)?.what : (EXTRA_MEANING.find(([re]) => re.test(m.name))?.[1] || "");
        lines.push(`• ${m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ""}${m.range ? ` (usual range ${m.range})` : ""}.${what ? ` ${what}` : ""}`);
      });
    } else {
      lines.push("\nNothing on this report stands out as outside the usual range.");
    }
    lines.push(`\n${formal ? "We will review these results with you at your next appointment." : "We'll go over these at your next visit."} Please don't change any medicines on your own because of these numbers.`);
    lines.push(`\n${formal ? "If you have questions before then, please contact our office." : "If you have questions before then, just call the office."}\n\n${clinic?.clinician_name || "Your care team"}${clinic?.name ? `, ${clinic.name}` : ""}`);
    return lines.join("\n");
  }


  // ----- One-page doctor brief (stays in the clinic; never sent to the patient) -----
  function briefHtml(markers, patientRef, labDate) {
    const flagged = markers.filter(isFlagged);
    const unsure = markers.filter((m) => m.low_confidence && !isFlagged(m));
    const inRange = markers.length - flagged.length - unsure.length;
    const questions = $("db-questions").value.split("\n").map((q) => q.trim()).filter(Boolean);
    const words = $("db-summary").value.trim().split(/\s+/).filter(Boolean).length;
    const row = (m) => `<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(`${m.value} ${m.unit}`.trim())}</td><td>${escapeHtml(m.range || "none printed")}</td><td>${escapeHtml(m.status || "")}</td></tr>`;
    return `<h5>Doctor brief · ${escapeHtml(patientRef)} · lab ${escapeHtml(labDate || "date not given")}</h5>
      <p class="db-muted">Draft for clinician review. This brief stays in the clinic and is not sent to the patient.</p>
      <p><b>${markers.length} results:</b> ${flagged.length} outside the lab's range, ${inRange} in range${unsure.length ? `, ${unsure.length} to confirm (no printed range)` : ""}.</p>
      ${flagged.length ? `<div class="db-table"><table><tr><th>Outside range</th><th>Result</th><th>Lab range</th><th>Status</th></tr>${flagged.map(row).join("")}</table></div>` : "<p>No results outside the lab's printed range.</p>"}
      ${unsure.length ? `<p><b>Confirm against the original:</b> ${unsure.map((m) => escapeHtml(`${m.name} ${m.value} ${m.unit}`.trim())).join("; ")}</p>` : ""}
      <p><b>Patient explanation:</b> ${words ? `drafted (${words} words), waiting for your approval` : "not written yet"}.</p>
      ${questions.length ? `<p><b>Questions the patient may ask:</b></p><ol>${questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>` : ""}
      <p class="db-muted">${escapeHtml(clinic?.name || "")}${clinic?.name ? " · " : ""}Prepared ${escapeHtml(new Date().toLocaleString())} from the lab as received. Values were read automatically; check them against the original report.</p>`;
  }

  function renderBrief() {
    if (!current) return;
    $("db-brief-body").innerHTML = briefHtml(current.markers || [], current.patientRef, current.labDate);
  }

  function printBrief() {
    if (!current) return;
    const win = window.open("", "_blank", "width=820,height=1000");
    if (!win) return say("Allow pop-ups to print the brief.");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Doctor brief</title><style>
      body{font:13px/1.45 system-ui,sans-serif;color:#1f2933;margin:28px}h5{font-size:17px;margin:0 0 6px}
      table{width:100%;border-collapse:collapse;margin:6px 0}th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #ddd}
      th{background:#f1f8f6}.db-muted{color:#5b6670;font-size:12px}@page{size:letter;margin:14mm}</style></head>
      <body>${briefHtml(current.markers || [], current.patientRef, current.labDate)}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  function renderReview(markers, patientRef, labDate = "") {
    $("db-review-ref").textContent = `· ${patientRef}`;
    $("db-values").innerHTML = markers.length ? `<div class="db-table"><table><tr><th>Test</th><th>Result</th><th>Range</th><th>Status</th></tr>${markers.map((m) => `
      <tr class="${isFlagged(m) ? "db-flag" : ""}"><td>${escapeHtml(m.name)}</td><td>${escapeHtml(`${m.value} ${m.unit}`.trim())}</td><td>${escapeHtml(m.range || "—")}</td><td>${escapeHtml(m.status || "—")}${m.low_confidence ? ' <em class="db-check-tag">check</em>' : ""}</td></tr>`).join("")}</table></div>` : "<p><b>Needs manual review:</b> no values could be read from this lab. Type the key values into the explanation yourself; nothing is guessed.</p>";
    $("db-review").hidden = false;
    $("db-link").hidden = true;
    if (current) current.labDate = current.labDate || labDate;
    renderBrief();
    $("db-approve").hidden = !canApprove();
    $("db-reject").hidden = !canApprove();
    $("db-approver-note").hidden = canApprove();
    if (typeof scrollBelowHeader === "function") scrollBelowHeader($("db-review"));
    else $("db-review").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function readInput() {
    const file = $("db-file").files?.[0];
    if (file && /pdf$/i.test(file.name || "") ) return extractPdfText(file);
    if (file) return file.text();
    return $("db-text").value;
  }

  async function createDraft() {
    if (!clinic) return;
    const patientRef = $("db-patient-ref").value.trim();
    if (!patientRef) return say("Add a patient reference (an ID or initials, never a full name).");
    if (!$("db-deid").checked) return say("Please confirm the lab is de-identified or a sample. That's required during the pilot.");
    say("Reading the lab on this device…");
    let text = "";
    try {
      text = (await readInput()).trim();
    } catch {
      return say("That file could not be read. Try pasting the lab text instead.");
    }
    if (!text) return say("Add a lab PDF or paste the lab text first.");
    const analysis = analyzeReportTextLocally(text);
    const markers = markersFrom(analysis, text);
    const labDate = $("db-lab-date").value || "";
    const summary = draftText(analysis, markers, labDate);
    const questions = (analysis.questions || []).slice(0, 3);
    try {
      const packet = await apiPost(`/clinics/${clinic.id}/packets`, { patient_ref: patientRef, lab_date: labDate, markers, summary, questions, deidentified_confirmed: true });
      current = { packetId: packet.id, markers, patientRef, labDate };
      $("db-summary").value = summary;
      $("db-questions").value = questions.join("\n");
      renderReview(markers, patientRef, labDate);
      say("Draft ready. Edit anything, then approve. The review timer started when the draft was made.");
      refresh();
    } catch {
      say("The draft could not be saved. Check your connection and try again.");
    }
  }

  function editPayload() {
    return { summary: $("db-summary").value, questions: $("db-questions").value.split("\n").map((q) => q.trim()).filter(Boolean).slice(0, 10) };
  }

  async function approve() {
    if (!current) return;
    if (!$("db-summary").value.trim()) return say("Add the patient explanation before approving.");
    try {
      const packet = await apiPost(`/clinics/${clinic.id}/packets/${current.packetId}/approve`, editPayload());
      $("db-link-url").value = `${window.location.origin}/packet.html#t=${encodeURIComponent(packet.patient_token)}`;
      $("db-link").hidden = false;
      say(`Approved by ${packet.approved_by_name} in ${packet.review_seconds < 120 ? `${packet.review_seconds} seconds` : `${Math.round(packet.review_seconds / 60)} minutes`}. Send the link to the patient through your usual secure channel.`);
      current = null;
      refresh();
    } catch (error) {
      say(/409/.test(String(error?.message)) ? "This lab was already approved." : "Approval failed. Please try again.");
    }
  }

  async function saveDraft() {
    if (!current) return;
    try {
      await apiPut(`/clinics/${clinic.id}/packets/${current.packetId}`, editPayload());
      say("Draft saved. It stays in the inbox until someone approves it.");
      refresh();
    } catch {
      say("The draft could not be saved.");
    }
  }

  async function followUp() {
    if (!current) return;
    try {
      await apiPut(`/clinics/${clinic.id}/packets/${current.packetId}`, editPayload());
      await apiPost(`/clinics/${clinic.id}/packets/${current.packetId}/follow-up`, {});
      say("Marked as needs a follow-up call. Nothing was sent to the patient.");
      $("db-review").hidden = true;
      current = null;
      refresh();
    } catch {
      say("Could not update the lab. Please try again.");
    }
  }

  // Collected/reported date printed on the lab, as YYYY-MM-DD, if one can be found.
  function labDateFrom(text) {
    const match = text.match(/(?:collected|collection date|drawn|specimen date|date of service)\D{0,12}(\d{1,2})\/(\d{1,2})\/(\d{4})/i)
      || text.match(/(?:collected|collection date|drawn|specimen date|date of service)\D{0,12}(\d{4})-(\d{2})-(\d{2})/i);
    if (!match) return "";
    const [y, m, d] = match[1].length === 4 ? [match[1], match[2], match[3]] : [match[3], match[1], match[2]];
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // A lab that arrived by email: read its text with the same parser as uploads, on this
  // screen, and save the first draft.
  async function draftEmailedPacket(p) {
    say("Reading the emailed lab on this device…");
    try {
      const { text } = await apiGet(`/clinics/${clinic.id}/packets/${p.id}/source`);
      const analysis = analyzeReportTextLocally(text || "");
      const markers = text ? markersFrom(analysis, text) : [];
      const labDate = p.lab_date || labDateFrom(text || "");
      const summary = markers.length ? draftText(analysis, markers, labDate) : "";
      const questions = (analysis.questions || []).slice(0, 3);
      const saved = await apiPut(`/clinics/${clinic.id}/packets/${p.id}`, { summary, questions, markers, lab_date: labDate });
      current = { packetId: saved.id, markers: saved.markers, patientRef: saved.patient_ref, labDate: saved.lab_date || labDate };
      $("db-summary").value = saved.summary;
      $("db-questions").value = (saved.questions || []).join("\n");
      renderReview(saved.markers, saved.patient_ref, current.labDate);
      say(markers.length ? "Draft ready from the emailed lab. Edit anything, then approve." : "No values could be read from this PDF. Type the key values into the explanation yourself.");
      refresh();
    } catch {
      say("The emailed lab could not be opened. Try again.");
    }
  }

  function openPacket(id) {
    const packets = JSON.parse($("db-list").dataset.packets || "[]");
    const p = packets.find((item) => item.id === id);
    if (!p) return;
    if (p.status === "new") {
      draftEmailedPacket(p);
      return;
    }
    current = { packetId: p.id, markers: p.markers, patientRef: p.patient_ref, labDate: p.lab_date || "" };
    $("db-summary").value = p.summary;
    $("db-questions").value = (p.questions || []).join("\n");
    renderReview(p.markers, p.patient_ref, current.labDate);
  }

  async function visitSummary(ref) {
    try {
      const data = await apiGet(`/clinics/${clinic.id}/patients/${encodeURIComponent(ref)}/summary`);
      const latest = data.packets[data.packets.length - 1];
      const flagged = (latest?.markers || []).filter(isFlagged);
      $("db-visit").innerHTML = `
        <div class="db-list-head"><h4>Visit summary · ${escapeHtml(ref)}</h4><button class="text-button" type="button" data-db-close-visit>Close</button></div>
        <p class="db-muted">${data.packets.length} lab${data.packets.length === 1 ? "" : "s"} on file · latest ${escapeHtml(latest?.lab_date || "undated")}</p>
        <h5>What changed since the last lab</h5>
        ${data.changes.length ? `<ul>${data.changes.map((c) => `<li><b>${escapeHtml(c.name)}</b>: ${escapeHtml(c.before)} → ${escapeHtml(c.now)} ${escapeHtml(c.unit)}${c.status ? ` (${escapeHtml(c.status)})` : ""}</li>`).join("")}</ul>` : "<p>No earlier lab with the same tests to compare.</p>"}
        <h5>Outside the usual range now</h5>
        ${flagged.length ? `<ul>${flagged.map((m) => `<li>${escapeHtml(m.name)}: ${escapeHtml(`${m.value} ${m.unit}`.trim())}</li>`).join("")}</ul>` : "<p>None flagged.</p>"}
        <h5>What the patient was told</h5>
        <p>${latest?.status === "approved" ? `Approved by ${escapeHtml(latest.approved_by_name)}${latest.patient_viewed ? " · the patient opened it" : " · not opened yet"}` : "Not sent yet."}</p>
        <blockquote>${escapeHtml(latest?.summary || "").replace(/\n/g, "<br>")}</blockquote>
        <h5>Questions the patient may ask</h5>
        ${(latest?.questions || []).length ? `<ol>${latest.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>` : "<p>None recorded.</p>"}
        ${agendaBlock(flagged.length, (latest?.questions || []).length, data.changes.length)}
        ${coverageBlock(latest?.markers || [])}`;
      $("db-visit").hidden = false;
      if (typeof scrollBelowHeader === "function") scrollBelowHeader($("db-visit"));
      else $("db-visit").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      say("Could not load the visit summary.");
    }
  }

  async function reject() {
    if (!current) return;
    try {
      await apiPost(`/clinics/${clinic.id}/packets/${current.packetId}/reject`, {});
      say("Rejected. Nothing was sent to the patient.");
      $("db-review").hidden = true;
      current = null;
      refresh();
    } catch {
      say("Could not reject this lab. Please try again.");
    }
  }

  async function showAudit(id) {
    try {
      const steps = await apiGet(`/clinics/${clinic.id}/packets/${id}/audit`);
      $("db-visit").innerHTML = `<div class="db-list-head"><h4>History of this lab</h4><button class="text-button" type="button" data-db-close-visit>Close</button></div>
        <ol class="db-audit">${steps.map((s) => `<li><b>${escapeHtml(s.action)}</b> · ${escapeHtml(s.who)} · ${escapeHtml(new Date(s.at).toLocaleString())}</li>`).join("")}</ol>`;
      $("db-visit").hidden = false;
      if (typeof scrollBelowHeader === "function") scrollBelowHeader($("db-visit"));
    } catch {
      say("Could not load the history.");
    }
  }

  async function loadTeam() {
    if (!clinic) return;
    try {
      const members = await apiGet(`/clinics/${clinic.id}/members`);
      const label = { owner: "Owner", clinician: "Clinician (can approve)", front_desk: "Front desk (drafts only)" };
      const isOwner = clinic.member_role === "owner";
      const controls = (m) => {
        if (isOwner && !m.you && m.role !== "owner") {
          return `<div class="db-actions"><label class="visually-hidden" for="db-role-${escapeHtml(m.id)}">Role for ${escapeHtml(m.name)}</label>
            <select id="db-role-${escapeHtml(m.id)}" data-db-role="${escapeHtml(m.id)}">
              <option value="clinician"${m.role === "clinician" ? " selected" : ""}>Clinician (can approve)</option>
              <option value="front_desk"${m.role === "front_desk" ? " selected" : ""}>Front desk (drafts only)</option>
            </select>
            <button type="button" class="secondary-button compact" data-db-remove="${escapeHtml(m.id)}">Remove</button></div>`;
        }
        if (m.you && !isOwner) return `<button type="button" class="secondary-button compact" data-db-leave>Leave this clinic</button>`;
        return "";
      };
      $("db-members").innerHTML = members.map((m) => `<div class="db-row"><div><strong>${escapeHtml(m.name)}${m.you ? " (you)" : ""}</strong><span>${escapeHtml(label[m.role] || m.role)}</span></div>${controls(m)}</div>`).join("");
      $("db-invite-box").hidden = !isOwner;
    } catch {
      $("db-members").innerHTML = "<p>Could not load the team.</p>";
    }
  }

  // ----- Clinic settings (owner only) -----
  function fillSettings() {
    const owner = clinic?.member_role === "owner";
    $("db-settings").hidden = !owner;
    if (!owner) return;
    $("db-set-name").value = clinic.name;
    $("db-set-tone").value = clinic.tone || "friendly";
    $("db-set-retention").value = String(clinic.retention_days || 90);
  }
  $("db-settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const saved = await apiPut(`/clinics/${clinic.id}/settings`, {
        name: $("db-set-name").value.trim(),
        tone: $("db-set-tone").value,
        retention_days: Number($("db-set-retention").value),
      });
      clinic = { ...clinic, ...saved };
      $("db-badge").textContent = `${clinic.name} · Pilot`;
      say("Settings saved.");
    } catch {
      say("Settings could not be saved. Check the clinic name and try again.");
    }
  });
  $("db-audit-download").addEventListener("click", async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/clinics/${clinic.id}/audit.csv`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!response.ok) throw new Error(String(response.status));
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = (response.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/)?.[1] || "docbridge-audit.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      say("Activity log downloaded.");
    } catch {
      say("The activity log could not be downloaded. Try again.");
    }
  });

  $("db-intake-copy").addEventListener("click", () => {
    navigator.clipboard?.writeText($("db-intake-address").textContent)
      .then(() => say("Intake address copied."))
      .catch(() => say("Select the address and copy it."));
  });

  // Refresh the team each time it is opened, so new joiners show up.
  $("db-team").addEventListener("toggle", (event) => { if (event.target.open) loadTeam(); });

  // Team changes by the owner; removing someone keeps their past steps in the audit trail.
  $("db-members").addEventListener("change", async (event) => {
    const select = event.target.closest("[data-db-role]");
    if (!select || !clinic) return;
    try {
      await apiPut(`/clinics/${clinic.id}/members/${encodeURIComponent(select.dataset.dbRole)}`, { role: select.value });
      say("Role updated.");
    } catch {
      say("The role could not be changed. Try again.");
    }
    loadTeam();
  });
  $("db-members").addEventListener("click", async (event) => {
    const remove = event.target.closest("[data-db-remove]");
    const confirmRemove = event.target.closest("[data-db-confirm-remove]");
    const leave = event.target.closest("[data-db-leave]");
    const confirmLeave = event.target.closest("[data-db-confirm-leave]");
    if (!clinic || !(remove || confirmRemove || leave || confirmLeave)) return;
    // No confirm() dialogs in some app views: ask for a second tap instead.
    if (remove) { remove.outerHTML = `<button type="button" class="secondary-button compact db-danger" data-db-confirm-remove="${escapeHtml(remove.dataset.dbRemove)}">Tap again to remove</button>`; return; }
    if (leave) { leave.outerHTML = `<button type="button" class="secondary-button compact db-danger" data-db-confirm-leave>Tap again to leave</button>`; return; }
    try {
      if (confirmRemove) {
        await requestJson("DELETE", `/clinics/${clinic.id}/members/${encodeURIComponent(confirmRemove.dataset.dbConfirmRemove)}`);
        say("Removed from the team. Their past steps stay in the audit trail.");
        loadTeam();
      } else {
        await apiPost(`/clinics/${clinic.id}/leave`, {});
        clinic = null;
        say("You left the clinic.");
        load();
      }
    } catch {
      say("That didn't work. Try again.");
    }
  });

  // Sign out after 15 minutes without activity while DocBridge is in use.
  let idleTimer = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (!clinic || !authToken) return;
    idleTimer = setTimeout(() => {
      if (!clinic || panel.hidden) return;
      if (typeof logout === "function") logout();
      clinic = null;
      show("signin");
      say("Signed out after 15 minutes without activity. Sign in again to continue.");
    }, 15 * 60 * 1000);
  }
  ["click", "keydown", "input"].forEach((type) => panel.addEventListener(type, resetIdle));

  // ----- Wiring -----
  $("db-setup").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      clinic = await apiPost("/clinics", { name: $("db-clinic-name").value.trim(), clinician_name: $("db-clinician-name").value.trim(), tone: $("db-tone").value });
      say(`${clinic.name} is set up. Add your first lab below.`);
      load();
    } catch (error) {
      say(/409/.test(String(error?.message)) ? "This account already has a clinic." : "The clinic could not be created. Check the fields and try again.");
    }
  });
  $("db-draft").addEventListener("click", createDraft);
  $("db-sample").addEventListener("click", () => {
    $("db-text").value = SAMPLE_LAB;
    $("db-file").value = "";
    $("db-patient-ref").value ||= "SAMPLE-001";
    $("db-lab-date").value = "2026-10-01";
    $("db-deid").checked = true;
    say("Sample lab added. Press Draft explanation.");
  });
  $("db-approve").addEventListener("click", approve);
  $("db-reject").addEventListener("click", reject);
  $("db-join").addEventListener("click", async () => {
    try {
      clinic = await apiPost("/clinics/join", { code: $("db-join-code").value.trim(), display_name: $("db-join-name").value.trim() });
      say(`You joined ${clinic.name}.`);
      load();
    } catch (error) {
      say(/409/.test(String(error?.message)) ? "This account already belongs to a clinic." : "That invite code isn't valid. Ask your clinic for a new one.");
    }
  });
  $("db-invite").addEventListener("click", async () => {
    try {
      const invite = await apiPost(`/clinics/${clinic.id}/invites`, { role: $("db-invite-role").value });
      $("db-invite-code").textContent = `Invite code: ${invite.code} (one use, works for 7 days). Your colleague signs in, opens For doctors, and enters it under "Have an invite code?".`;
    } catch {
      $("db-invite-code").textContent = "Could not create an invite.";
    }
  });
  $("db-waitlist").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await apiPost("/product/early-access", { email: $("db-wl-email").value.trim(), role: "clinician", note: $("db-wl-note").value.trim(), consent: $("db-wl-consent").checked, source: "web" }, { skipAuth: true });
      $("db-wl-status").textContent = "Thank you. We'll be in touch about a pilot.";
      event.target.reset();
    } catch {
      $("db-wl-status").textContent = "Could not join right now. Please try again.";
    }
  });
  $("db-save").addEventListener("click", saveDraft);
  $("db-followup").addEventListener("click", followUp);
  $("db-refresh").addEventListener("click", refresh);
  $("db-brief-print").addEventListener("click", printBrief);
  $("db-brief").addEventListener("toggle", (event) => { if (event.target.open) renderBrief(); });
  ["db-summary", "db-questions"].forEach((id) => $(id).addEventListener("input", () => { if ($("db-brief").open) renderBrief(); }));
  $("db-copy").addEventListener("click", () => {
    $("db-link-url").select();
    navigator.clipboard?.writeText($("db-link-url").value).then(() => say("Patient link copied.")).catch(() => say("Select the link and copy it."));
  });
  panel.addEventListener("click", (event) => {
    const open = event.target.closest("[data-db-open]");
    if (open) openPacket(open.dataset.dbOpen);
    const visit = event.target.closest("[data-db-visit]");
    if (visit) visitSummary(visit.dataset.dbVisit);
    if (event.target.closest("[data-db-close-visit]")) $("db-visit").hidden = true;
    const audit = event.target.closest("[data-db-audit]");
    if (audit) showAudit(audit.dataset.dbAudit);
  });

  new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  const badge = $("auth-badge");
  if (badge) new MutationObserver(() => { if (!panel.hidden) load(); }).observe(badge, { childList: true, characterData: true, subtree: true });
  if (!panel.hidden) load();
})();
