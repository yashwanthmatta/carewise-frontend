// Medicine reminders: times saved to the account, optional phone calls (the person
// presses 1 once it's taken) and an email to the family if a reminder isn't confirmed.
// Loaded after script.js and uses its helpers (apiGet, apiPost, apiPut, requestJson,
// authToken, backendFeatures, escapeHtml).

(() => {
  const panel = document.querySelector(".reminders-panel");
  if (!panel) return;
  const byId = (id) => document.getElementById(id);
  const form = byId("rm-form");
  const list = byId("rm-list");
  const statusLine = byId("rm-status");
  const timeList = byId("rm-time-list");
  const DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
  const DOSE_TEXT = { upcoming: "Upcoming", due: "Due now", calling: "Calling", taken: "Taken", missed: "Not confirmed", past: "Earlier", stopped: "Calls stopped" };
  let reminders = [];
  let editingId = "";

  byId("rm-day-list").innerHTML = DAYS.map(([value, label]) =>
    `<label class="rm-day"><input type="checkbox" value="${value}" checked /> ${label}</label>`).join("");

  function addTimeInput(value = "08:00") {
    if (timeList.children.length >= 4) return;
    const row = document.createElement("div");
    row.className = "rm-time-row";
    row.innerHTML = `<input type="time" value="${escapeHtml(value)}" required aria-label="Reminder time" />
      <button type="button" class="link-button" data-rm-remove-time>Remove</button>`;
    timeList.appendChild(row);
    syncTimeButtons();
  }

  function syncTimeButtons() {
    const rows = [...timeList.children];
    rows.forEach((row) => { row.querySelector("[data-rm-remove-time]").hidden = rows.length === 1; });
    byId("rm-add-time").hidden = rows.length >= 4;
  }

  function formatClock(clock) {
    const [hour, minute] = clock.split(":").map(Number);
    return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function describeDays(days) {
    if (!days.length) return "Every day";
    return DAYS.filter(([value]) => days.includes(value)).map(([, label]) => label).join(", ");
  }

  function callLine(item) {
    if (!item.call) return "";
    const number = item.phone_last4 ? `••${escapeHtml(item.phone_last4)}` : "their phone";
    if (item.call_status === "pending_consent") {
      const live = backendFeatures.reminder_calls
        ? `Waiting for ${escapeHtml(item.person)} to press 1 on the first call to ${number}.`
        : `Calls to ${number} start as soon as phone calling is switched on.`;
      return `<p class="rm-call-line">${live}${backendFeatures.reminder_calls ? ` <button type="button" class="link-button" data-rm-consent="${escapeHtml(item.id)}">Call again</button>` : ""}</p>`;
    }
    if (item.call_status === "active") return `<p class="rm-call-line rm-ok">Calls to ${number} at each time. ${escapeHtml(item.person)} presses 1 once it's taken.</p>`;
    if (item.call_status === "stopped") return `<p class="rm-call-line">${escapeHtml(item.person)} pressed 9 to stop calls. Edit the reminder to start them again.</p>`;
    return "";
  }

  function card(item) {
    const doses = item.today.length
      ? item.today.map((dose) => `<span class="rm-dose rm-dose-${escapeHtml(dose.status)}">${escapeHtml(formatClock(dose.time))} · ${escapeHtml(DOSE_TEXT[dose.status] || dose.status)}</span>`).join("")
      : `<span class="rm-dose">No reminder today</span>`;
    const title = item.label ? `${escapeHtml(item.person)} · ${escapeHtml(item.label)}` : escapeHtml(item.person);
    return `<article class="rm-card">
      <div class="rm-card-head">
        <div><strong>${title}</strong><span>${escapeHtml(item.times.map(formatClock).join(", "))} · ${escapeHtml(describeDays(item.days))}</span></div>
        <div class="rm-actions">
          <button type="button" class="secondary-button compact" data-rm-taken="${escapeHtml(item.id)}">Mark taken</button>
          <button type="button" class="link-button" data-rm-calendar="${escapeHtml(item.id)}">Add to calendar</button>
          <button type="button" class="link-button" data-rm-edit="${escapeHtml(item.id)}">Edit</button>
          <button type="button" class="link-button" data-rm-delete="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
      <div class="rm-today" aria-label="Today">${doses}</div>
      ${callLine(item)}
    </article>`;
  }

  async function load() {
    const signedIn = Boolean(authToken);
    byId("rm-signin").hidden = signedIn;
    byId("rm-add").hidden = !signedIn;
    if (!signedIn) {
      form.hidden = true;
      list.innerHTML = "";
      return;
    }
    try {
      reminders = await apiGet("/reminders");
      list.innerHTML = reminders.length
        ? reminders.map(card).join("")
        : `<p class="rm-empty">No reminders yet. Press "Add a reminder" to set medicine times.</p>`;
    } catch {
      list.innerHTML = "<p class=\"rm-empty\">Reminders could not load right now. Check your connection and try again.</p>";
    }
  }

  function openForm(item = null) {
    editingId = item?.id || "";
    form.hidden = false;
    statusLine.textContent = "";
    byId("rm-person").value = item?.person || "Me";
    byId("rm-label").value = item?.label || "";
    timeList.innerHTML = "";
    (item?.times?.length ? item.times : ["08:00"]).forEach(addTimeInput);
    byId("rm-day-list").querySelectorAll("input").forEach((box) => { box.checked = !item?.days?.length || item.days.includes(box.value); });
    byId("rm-call").checked = Boolean(item?.call);
    byId("rm-phone").value = "";
    byId("rm-phone").placeholder = item?.phone_last4 ? `Leave blank to keep the number ending ${item.phone_last4}` : "+1 555 123 4567";
    byId("rm-caller").value = item?.caller_name || "";
    byId("rm-language").value = item?.language || "en";
    byId("rm-consent").checked = false;
    byId("rm-alert").checked = Boolean(item?.alert_on_miss);
    byId("rm-save").textContent = item ? "Save changes" : "Save reminder";
    syncCallFields();
    byId("rm-label").focus();
  }

  function syncCallFields() {
    const on = byId("rm-call").checked;
    byId("rm-call-fields").hidden = !on;
    byId("rm-call-setup").hidden = !on || Boolean(backendFeatures.reminder_calls);
  }

  async function save(event) {
    event.preventDefault();
    const call = byId("rm-call").checked;
    const payload = {
      person: byId("rm-person").value.trim() || "Me",
      label: byId("rm-label").value.trim(),
      times: [...timeList.querySelectorAll("input")].map((input) => input.value).filter(Boolean),
      days: [...byId("rm-day-list").querySelectorAll("input:checked")].map((box) => box.value),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      language: byId("rm-language").value,
      call,
      phone: byId("rm-phone").value.trim(),
      caller_name: byId("rm-caller").value.trim(),
      consent_confirmed: byId("rm-consent").checked,
      alert_on_miss: byId("rm-alert").checked,
    };
    if (!payload.times.length) { statusLine.textContent = "Add at least one time."; return; }
    if (!payload.days.length) { statusLine.textContent = "Pick at least one day."; return; }
    const current = reminders.find((entry) => entry.id === editingId);
    const keepNumber = Boolean(current?.phone_last4) && ["active", "pending_consent"].includes(current?.call_status) && !payload.phone;
    if (call && !keepNumber && !/^\+?[\d\s().-]{8,20}$/.test(payload.phone)) { statusLine.textContent = "Enter their phone number with the country code, like +1 555 123 4567."; return; }
    if (call && payload.phone && !payload.phone.startsWith("+")) payload.phone = `+1${payload.phone.replace(/\D/g, "")}`;
    if (call && !keepNumber && !payload.consent_confirmed) { statusLine.textContent = "Tick the box to confirm they agreed to get these calls."; return; }
    byId("rm-save").disabled = true;
    try {
      if (editingId) await apiPut(`/reminders/${encodeURIComponent(editingId)}`, payload);
      else await apiPost("/reminders", payload);
      form.hidden = true;
      statusLine.textContent = call && backendFeatures.reminder_calls
        ? `Reminder saved. CareWise will call ${payload.person} now to ask them to press 1 and agree.`
        : "Reminder saved.";
      await load();
    } catch (error) {
      const code = String(error?.message || "");
      statusLine.textContent = /409/.test(code) ? "You have the most reminders allowed. Delete one first."
        : /422/.test(code) ? "Check the times and phone number, then try again."
        : /429/.test(code) ? "Too many phone setups today. Try again tomorrow."
        : "The reminder could not be saved. Check your connection and try again.";
    } finally {
      byId("rm-save").disabled = false;
    }
  }

  function downloadCalendar(item) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const today = new Date();
    const rule = item.days.length ? `RRULE:FREQ=WEEKLY;BYDAY=${item.days.map((day) => day.slice(0, 2).toUpperCase()).join(",")}` : "RRULE:FREQ=DAILY";
    const title = item.person === "Me" ? "Time for your medicine" : `Medicine time for ${item.person}`;
    const events = item.times.map((clock, index) => {
      const [hour, minute] = clock.split(":");
      const start = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}T${hour}${minute}00`;
      return ["BEGIN:VEVENT", `UID:carewise-${item.id}-${index}@carewise`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, "DURATION:PT10M", rule,
        `SUMMARY:${title}${item.label ? ` (${item.label.replace(/[,;\\]/g, " ")})` : ""}`,
        "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Medicine reminder", "END:VALARM", "END:VEVENT"].join("\r\n");
    });
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CareWise//Medicine reminder//EN", ...events, "END:VCALENDAR"].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = "carewise-medicine-reminder.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    statusLine.textContent = "Calendar file ready. Open it to add these times to your phone's calendar.";
  }

  async function act(event) {
    const button = event.target.closest("[data-rm-taken],[data-rm-edit],[data-rm-delete],[data-rm-calendar],[data-rm-consent],[data-rm-confirm-delete]");
    if (!button) return;
    const id = button.dataset.rmTaken || button.dataset.rmEdit || button.dataset.rmDelete || button.dataset.rmCalendar || button.dataset.rmConsent || button.dataset.rmConfirmDelete;
    const item = reminders.find((entry) => entry.id === id);
    if (!item) return;
    try {
      if (button.dataset.rmTaken) {
        await apiPost(`/reminders/${encodeURIComponent(id)}/taken`, {});
        statusLine.textContent = `Marked as taken for ${item.person}.`;
        await load();
      } else if (button.dataset.rmEdit) {
        openForm(item);
      } else if (button.dataset.rmCalendar) {
        downloadCalendar(item);
      } else if (button.dataset.rmConsent) {
        await apiPost(`/reminders/${encodeURIComponent(id)}/consent-call`, {});
        statusLine.textContent = `Calling ${item.person} again to ask them to press 1.`;
        await load();
      } else if (button.dataset.rmDelete) {
        // No confirm() dialog in some browsers' app views: ask inline instead.
        button.outerHTML = `<button type="button" class="link-button rm-danger" data-rm-confirm-delete="${escapeHtml(id)}">Tap again to delete</button>`;
      } else if (button.dataset.rmConfirmDelete) {
        await requestJson("DELETE", `/reminders/${encodeURIComponent(id)}`);
        statusLine.textContent = "Reminder deleted. No more calls will go out for it.";
        await load();
      }
    } catch (error) {
      statusLine.textContent = /429/.test(String(error?.message)) ? "That was tried a few times today. Try again tomorrow." : "That didn't work. Check your connection and try again.";
    }
  }

  byId("rm-add").addEventListener("click", () => openForm());
  byId("rm-cancel").addEventListener("click", () => { form.hidden = true; });
  byId("rm-add-time").addEventListener("click", () => addTimeInput("20:00"));
  byId("rm-call").addEventListener("change", syncCallFields);
  timeList.addEventListener("click", (event) => {
    if (event.target.closest("[data-rm-remove-time]")) { event.target.closest(".rm-time-row").remove(); syncTimeButtons(); }
  });
  form.addEventListener("submit", save);
  list.addEventListener("click", act);

  // Refresh when the Record tab opens or someone signs in or out.
  new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  const badge = byId("auth-badge");
  if (badge) new MutationObserver(() => { if (!panel.hidden) load(); }).observe(badge, { childList: true, characterData: true, subtree: true });
  load();
})();
