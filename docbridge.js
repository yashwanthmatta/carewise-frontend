// DocBridge (CareWise for doctors): draft a patient-ready lab explanation on this
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
      refresh();
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
      ["Waiting for review", m.drafts],
      ["Need a call", m.needs_call],
      ["Approved this week", m.approved_this_week],
      ["Median review time", review],
      ["Patients who opened", m.patients_opened],
    ].map(([label, value]) => `<div><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  }

  const STATUS_LABEL = { draft: "Waiting for review", needs_call: "Needs a call", approved: "Approved" };

  function renderList(packets) {
    if (!packets.length) {
      $("db-list").innerHTML = "<p>No labs yet. Add one above, or try the sample lab.</p>";
      return;
    }
    $("db-list").innerHTML = packets.map((p) => `
      <article class="db-row db-row-${escapeHtml(p.status)}">
        <div>
          <strong>${escapeHtml(p.patient_ref)}</strong>
          <span>${escapeHtml(p.lab_date || "No date")} · ${escapeHtml(STATUS_LABEL[p.status] || p.status)}${p.status === "approved" ? ` by ${escapeHtml(p.approved_by_name)}${p.patient_viewed ? " · opened by patient" : ""}` : ""}</span>
        </div>
        <div class="db-row-actions">
          ${p.status !== "approved" ? `<button class="secondary-button compact" type="button" data-db-open="${escapeHtml(p.id)}">Review</button>` : ""}
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
      markers.push({ name: item.label, value: String(item.value), unit: item.unit || "", range, status: item.flag || "", low_confidence: !range });
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

  function renderReview(markers, patientRef) {
    $("db-review-ref").textContent = `· ${patientRef}`;
    $("db-values").innerHTML = markers.length ? `<div class="db-table"><table><tr><th>Test</th><th>Result</th><th>Range</th><th>Status</th></tr>${markers.map((m) => `
      <tr class="${isFlagged(m) ? "db-flag" : ""}"><td>${escapeHtml(m.name)}</td><td>${escapeHtml(`${m.value} ${m.unit}`.trim())}</td><td>${escapeHtml(m.range || "—")}</td><td>${escapeHtml(m.status || "—")}${m.low_confidence ? ' <em class="db-check-tag">check</em>' : ""}</td></tr>`).join("")}</table></div>` : "<p>No values could be read. Type the key values into the explanation instead.</p>";
    $("db-review").hidden = false;
    $("db-link").hidden = true;
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
      current = { packetId: packet.id, markers, patientRef };
      $("db-summary").value = summary;
      $("db-questions").value = questions.join("\n");
      renderReview(markers, patientRef);
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

  function openPacket(id) {
    const packets = JSON.parse($("db-list").dataset.packets || "[]");
    const p = packets.find((item) => item.id === id);
    if (!p) return;
    current = { packetId: p.id, markers: p.markers, patientRef: p.patient_ref };
    $("db-summary").value = p.summary;
    $("db-questions").value = (p.questions || []).join("\n");
    renderReview(p.markers, p.patient_ref);
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
        ${(latest?.questions || []).length ? `<ol>${latest.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>` : "<p>None recorded.</p>"}`;
      $("db-visit").hidden = false;
      if (typeof scrollBelowHeader === "function") scrollBelowHeader($("db-visit"));
      else $("db-visit").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      say("Could not load the visit summary.");
    }
  }

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
  $("db-save").addEventListener("click", saveDraft);
  $("db-followup").addEventListener("click", followUp);
  $("db-refresh").addEventListener("click", refresh);
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
  });

  new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  const badge = $("auth-badge");
  if (badge) new MutationObserver(() => { if (!panel.hidden) load(); }).observe(badge, { childList: true, characterData: true, subtree: true });
  if (!panel.hidden) load();
})();
