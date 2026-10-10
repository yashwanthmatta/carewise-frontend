// "Share with my doctor": builds a read-only summary of the latest result and asks the
// backend for a private link that expires. Loaded after script.js and uses its shared
// helpers (apiGet, apiPost, authToken, latestReportAnalysis, latestReportPerson,
// getHealthRecordFor, buildHealthRecordSummary, LAB_PANEL_TEXT, escapeHtml).

(() => {
  const dialog = document.getElementById("share-dialog");
  if (!dialog) return;
  const byId = (id) => document.getElementById(id);
  const statusLine = byId("share-status");
  const createBox = byId("share-create");
  const signinBox = byId("share-signin");
  const resultBox = byId("share-result");
  const urlInput = byId("share-url");
  const createButton = byId("share-create-button");
  const profileList = byId("doctor-links-list");

  const NEXT_STEP = {
    urgent: "Contact the doctor today. If very unwell, seek emergency care.",
    needs_review: "Asked to discuss these results soon.",
    attention: "To bring up at the next visit.",
    routine: "Nothing urgent stands out. For the next checkup.",
  };

  function viewerUrl(token) {
    return `${window.location.origin}/share.html#t=${encodeURIComponent(token)}`;
  }

  // Always in English, like the doctor brief, and only what the family already sees.
  function buildSnapshot(analysis, person) {
    const record = buildHealthRecordSummary(getHealthRecordFor(person));
    const entry = (item) => ({ name: item.name, start: item.start || "", notes: item.notes || "" });
    return {
      version: 1,
      person,
      prepared_by: person === "Me" ? "the patient" : "a family caregiver",
      created_at: new Date().toISOString(),
      score: analysis.scanOnly || analysis.noData ? null : analysis.score,
      next_step: NEXT_STEP[analysis.riskLevel] || "",
      findings: (analysis.findings || []).map((item) => ({ label: item.label, level: item.level, detail: item.detail })),
      values: (analysis.labValues || []).map((item) => ({ label: item.label, value: String(item.value), unit: item.unit || "", flag: item.flag || "" })),
      panel: (analysis.panelResults || []).map((item) => ({
        name: item.name,
        result: `${item.valueText} ${item.unit || ""}`.trim(),
        range: item.rangeText || "",
        status: LAB_PANEL_TEXT.en[`status_${item.status}`] || item.status,
      })),
      scan: analysis.scan
        ? { modality: analysis.scan.en.modality || "Imaging", follow_ups: (analysis.scan.en.followUps || []).map((item) => item.sentence) }
        : null,
      history: {
        conditions: record.conditions.map(entry),
        medicines: record.medicines.map(entry),
        did_not_suit: record.reactions.map(entry),
      },
      questions: analysis.questions || [],
      changes: analysis._changes?.rows?.length
        ? { since: analysis._changes.since, rows: analysis._changes.rows.map((r) => ({ name: r.name, before: String(r.before), now: String(r.now), unit: r.unit, label: changeLabel(r, CHANGE_TEXT.en) })) }
        : null,
    };
  }

  function describeIncludes(analysis, person) {
    const record = buildHealthRecordSummary(getHealthRecordFor(person));
    const parts = ["the explained results", "your questions for the doctor"];
    if ((analysis.panelResults || []).length || (analysis.labValues || []).length) parts.unshift("test values");
    if (record.conditions.length || record.medicines.length || record.reactions.length) parts.push(`${person === "Me" ? "your" : `${person}'s`} health record`);
    return `It will include ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}. It won't include your name, email or the original report file.`;
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  }

  function linkRow(share) {
    const expired = new Date(share.expires_at) <= new Date();
    const state = share.revoked ? "Turned off" : expired ? "Expired" : `Works until ${formatDate(share.expires_at)}`;
    const views = share.view_count === 1 ? "Opened once" : share.view_count ? `Opened ${share.view_count} times` : "Not opened yet";
    const active = !share.revoked && !expired;
    return `<article class="share-row${active ? "" : " share-row-off"}">
      <div><strong>${escapeHtml(share.label || "Doctor link")}</strong>
      <span>${escapeHtml(state)} · ${escapeHtml(views)}${share.last_viewed_at ? ` · last ${escapeHtml(formatDate(share.last_viewed_at))}` : ""}</span></div>
      ${active ? `<button class="secondary-button compact" type="button" data-share-revoke="${escapeHtml(share.id)}">Turn off</button>` : ""}
    </article>`;
  }

  async function renderLists() {
    const targets = [byId("share-list"), profileList].filter(Boolean);
    if (!authToken) {
      targets.forEach((target) => { target.innerHTML = "<p>Sign in to see your doctor links.</p>"; });
      return;
    }
    try {
      const shares = await apiGet("/shares");
      const html = shares.length ? shares.map(linkRow).join("") : "<p>No links yet. Use \"Share with my doctor\" on a result.</p>";
      targets.forEach((target) => { target.innerHTML = html; });
    } catch {
      targets.forEach((target) => { target.innerHTML = "<p>Could not load your links right now.</p>"; });
    }
  }

  function openDoctorShare() {
    const analysis = typeof latestReportAnalysis !== "undefined" ? latestReportAnalysis : null;
    statusLine.textContent = "";
    resultBox.hidden = true;
    if (!analysis || analysis.noData) {
      if (typeof reportStatus !== "undefined" && reportStatus) reportStatus.textContent = "Explain a report first, then share it with your doctor.";
      return;
    }
    const signedIn = Boolean(authToken);
    signinBox.hidden = signedIn;
    createBox.hidden = !signedIn;
    byId("share-includes").textContent = describeIncludes(analysis, latestReportPerson || "Me");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    renderLists();
  }

  async function createLink() {
    const analysis = latestReportAnalysis;
    if (!analysis || !authToken) return;
    createButton.disabled = true;
    statusLine.textContent = "Creating your private link…";
    try {
      const share = await apiPost("/shares", {
        snapshot: buildSnapshot(analysis, latestReportPerson || "Me"),
        label: byId("share-label").value.trim(),
        days: Number(byId("share-days").value) || 7,
      });
      urlInput.value = viewerUrl(share.token);
      resultBox.hidden = false;
      byId("share-native").hidden = typeof navigator.share !== "function";
      statusLine.textContent = `Link ready. It works until ${formatDate(share.expires_at)}. You can turn it off any time.`;
      renderLists();
    } catch (error) {
      statusLine.textContent = /409/.test(String(error?.message))
        ? "You have many active links. Turn one off below, then try again."
        : "The link could not be created. Check your connection and try again.";
    } finally {
      createButton.disabled = false;
    }
  }

  async function revokeLink(shareId) {
    try {
      await apiPost(`/shares/${encodeURIComponent(shareId)}/revoke`, {});
      statusLine.textContent = "Link turned off. It no longer opens.";
    } catch {
      statusLine.textContent = "Could not turn the link off. Please try again.";
    }
    renderLists();
  }

  createButton.addEventListener("click", createLink);
  byId("share-list-wrap")?.addEventListener("toggle", (event) => { if (event.target.open) renderLists(); });
  byId("share-copy").addEventListener("click", () => {
    urlInput.select();
    navigator.clipboard?.writeText(urlInput.value)
      .then(() => { statusLine.textContent = "Link copied. Paste it into a message or email to your doctor."; })
      .catch(() => { statusLine.textContent = "Select the link above and copy it."; });
  });
  byId("share-native").addEventListener("click", () => {
    navigator.share?.({ title: "CareWise summary", text: "A summary of my lab results, shared from CareWise:", url: urlInput.value }).catch(() => undefined);
  });
  byId("share-signin-link").addEventListener("click", () => dialog.close());
  document.addEventListener("click", (event) => {
    const revoke = event.target.closest("[data-share-revoke]");
    if (revoke) {
      event.preventDefault();
      revokeLink(revoke.dataset.shareRevoke);
    }
  });

  // Refresh the Profile list when Profile opens or someone signs in or out.
  const panel = document.querySelector(".doctor-links-panel");
  if (panel) {
    new MutationObserver(() => { if (!panel.hidden) renderLists(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    const badge = byId("auth-badge");
    if (badge) new MutationObserver(() => { if (!panel.hidden) renderLists(); }).observe(badge, { childList: true, characterData: true, subtree: true });
  }

  window.openDoctorShare = openDoctorShare;
})();
