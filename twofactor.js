// Two-step sign-in settings on the Account screen: turn on with an authenticator app
// (QR code drawn on this device), save one-time backup codes, or turn it off.
// Loaded after script.js and uses its helpers (apiGet, apiPost, authToken, escapeHtml).

(() => {
  const panel = document.querySelector(".twofactor-panel");
  if (!panel) return;
  const byId = (id) => document.getElementById(id);
  const statusLine = byId("tf-status");
  const views = ["tf-signin", "tf-off", "tf-setup", "tf-codes", "tf-on"];
  let codes = [];

  function show(view) {
    views.forEach((id) => { byId(id).hidden = id !== view; });
  }

  function setBadge(on) {
    byId("tf-badge").textContent = on ? "On" : "Off";
    byId("tf-badge").className = `sync-badge ${on ? "online" : "offline"}`;
  }

  async function load() {
    statusLine.textContent = "";
    if (!authToken) {
      setBadge(false);
      show("tf-signin");
      return;
    }
    if (!byId("tf-setup").hidden || !byId("tf-codes").hidden) return;
    try {
      const me = await apiGet("/auth/me");
      setBadge(me.two_factor_enabled);
      show(me.two_factor_enabled ? "tf-on" : "tf-off");
    } catch {
      show("tf-off");
    }
  }

  function drawQr(url) {
    const box = byId("tf-qr");
    if (typeof qrcode !== "function") {
      box.textContent = "";
      return;
    }
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }

  async function start() {
    try {
      const setup = await apiPost("/auth/two-factor/setup", {});
      byId("tf-key").textContent = setup.secret.replace(/(.{4})/g, "$1 ").trim();
      drawQr(setup.otpauth_url);
      byId("tf-enable-code").value = "";
      show("tf-setup");
      byId("tf-enable-code").focus();
    } catch {
      statusLine.textContent = "Could not start setup. Check your connection and try again.";
    }
  }

  async function enable() {
    const code = byId("tf-enable-code").value.replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      statusLine.textContent = "Enter the 6-digit code your app shows.";
      return;
    }
    try {
      const result = await apiPost("/auth/two-factor/enable", { code });
      codes = result.recovery_codes || [];
      byId("tf-code-list").innerHTML = codes.map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join("");
      byId("tf-key").textContent = "";
      byId("tf-qr").innerHTML = "";
      setBadge(true);
      show("tf-codes");
      statusLine.textContent = "Two-step sign-in is on.";
    } catch (error) {
      statusLine.textContent = /429/.test(String(error?.message))
        ? "Too many tries. Wait a few minutes and try again."
        : "That code didn't work. Make sure the time on your phone is set automatically, then try the newest code.";
    }
  }

  async function disable() {
    const code = byId("tf-disable-code").value.trim();
    if (code.length < 6) {
      statusLine.textContent = "Enter a current code or a backup code.";
      return;
    }
    try {
      await apiPost("/auth/two-factor/disable", { code });
      byId("tf-disable-code").value = "";
      setBadge(false);
      show("tf-off");
      statusLine.textContent = "Two-step sign-in is off. You can turn it on again any time.";
    } catch {
      statusLine.textContent = "That code didn't work.";
    }
  }

  byId("tf-start").addEventListener("click", start);
  byId("tf-enable").addEventListener("click", enable);
  byId("tf-enable-code").addEventListener("keydown", (event) => { if (event.key === "Enter") enable(); });
  byId("tf-cancel").addEventListener("click", () => { byId("tf-qr").innerHTML = ""; show("tf-off"); statusLine.textContent = ""; });
  byId("tf-disable").addEventListener("click", disable);
  byId("tf-copy").addEventListener("click", () => {
    const text = codes.join("\n");
    navigator.clipboard?.writeText(text)
      .then(() => { statusLine.textContent = "Backup codes copied. Keep them somewhere safe, like a password manager."; })
      .catch(() => { statusLine.textContent = "Select the codes above and copy them."; });
  });
  byId("tf-done").addEventListener("click", () => { codes = []; byId("tf-code-list").innerHTML = ""; show("tf-on"); statusLine.textContent = ""; });

  // Refresh when Profile opens or someone signs in or out.
  new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  const badge = byId("auth-badge");
  if (badge) new MutationObserver(() => { if (!panel.hidden) load(); }).observe(badge, { childList: true, characterData: true, subtree: true });
  load();
})();
