// Sign-in card: Sign in / Create account tabs, forgot-password step, show-password toggles and a
// busy state while the server answers. The account requests themselves stay in script.js
// (login, signup, requestPasswordReset ...); this file only drives the card around them.
(() => {
  const card = document.querySelector("#auth-card");
  const form = document.querySelector("#auth-form");
  if (!card || !form) return;

  const status = document.querySelector("#auth-status");
  const title = card.querySelector("[data-auth-title]");
  const sub = card.querySelector("[data-auth-sub]");
  const password = document.querySelector("#auth-password");
  const passwordField = card.querySelector("[data-auth-password-field]");
  const tabList = card.querySelector("[data-auth-tabs]");
  const tabs = [...card.querySelectorAll("[data-auth-tab]")];
  const SLOW_SERVER_MS = 5000;
  const GIVE_UP_MS = 70000;
  const WAKING_MESSAGE = "Connecting to the server. The first sign-in after a quiet period can take up to a minute.";

  const MODES = {
    signin: { title: "Welcome back", sub: "Sign in to see your saved reports on any device.", submit: "#login" },
    signup: { title: "Create your free account", sub: "Save reports and open them on any device. Free, and you can delete it any time.", submit: "#signup" },
    forgot: { title: "Reset your password", sub: "Enter your account email and we'll send you a link to set a new password.", submit: "#password-reset" },
  };

  function setMode(mode, { focus = false, keepStatus = false } = {}) {
    const config = MODES[mode] || MODES.signin;
    card.dataset.authMode = mode;
    title.textContent = config.title;
    sub.textContent = config.sub;
    card.querySelectorAll("[data-signin-only]").forEach((el) => { el.hidden = mode !== "signin"; });
    card.querySelectorAll("[data-signup-only]").forEach((el) => { el.hidden = mode !== "signup"; });
    card.querySelectorAll("[data-forgot-only]").forEach((el) => { el.hidden = mode !== "forgot"; });
    passwordField.hidden = mode === "forgot";
    tabList.hidden = mode === "forgot";
    password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    // Only the visible button submits, so Enter always does what the screen shows.
    card.querySelectorAll(".auth-submit").forEach((button) => { button.type = "button"; });
    const submit = card.querySelector(config.submit);
    if (submit) submit.type = "submit";
    tabs.forEach((tab) => {
      const selected = tab.dataset.authTab === mode;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) form.setAttribute("aria-labelledby", tab.id);
    });
    if (status && !keepStatus) status.textContent = "";
    if (focus) document.querySelector("#auth-email")?.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setMode(tab.dataset.authTab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      setMode(next.dataset.authTab);
    });
  });
  card.querySelectorAll("[data-auth-go]").forEach((link) => {
    link.addEventListener("click", () => setMode(link.dataset.authGo, { focus: true }));
  });

  // The buttons' own click handlers (script.js) send the request; the form only stops a page reload.
  form.addEventListener("submit", (event) => event.preventDefault());

  document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.passwordToggle);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.textContent = show ? "Hide" : "Show";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  // Busy state: from the tap until script.js writes its answer into #auth-status. The server can
  // take up to a minute to wake after a quiet period, so say so instead of looking frozen.
  let busy = null;
  function clearBusy() {
    if (!busy) return;
    clearTimeout(busy.slowTimer);
    clearTimeout(busy.giveUpTimer);
    busy.button.removeAttribute("aria-busy");
    busy.button.classList.remove("is-busy");
    busy = null;
  }
  form.addEventListener("click", (event) => {
    const button = event.target.closest("#login, #signup, #password-reset, #confirm-password-reset, #tf-login-submit");
    if (!button) return;
    if (busy) {
      // Already waiting for the server: ignore repeat taps so the request isn't sent twice.
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    busy = {
      button,
      slowTimer: setTimeout(() => { if (busy && status) status.textContent = WAKING_MESSAGE; }, SLOW_SERVER_MS),
      giveUpTimer: setTimeout(clearBusy, GIVE_UP_MS),
    };
    button.setAttribute("aria-busy", "true");
    button.classList.add("is-busy");
  }, true);
  if (status) {
    new MutationObserver(() => {
      if (busy && status.textContent !== WAKING_MESSAGE) clearBusy();
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }

  // A link from a password-reset email opens the reset step with the code filled in (script.js).
  if (new URLSearchParams(window.location.search).get("reset_token")) {
    setMode("forgot", { keepStatus: true });
    const details = document.querySelector("#auth-reset-code");
    if (details) details.open = true;
  } else {
    setMode("signin", { keepStatus: true });
  }

  // Shortcuts to panels shown on this same screen (plan, two-step sign-in) scroll to them; the
  // hash router would otherwise treat their ids as unknown screens and open Home.
  document.querySelectorAll(".account-link[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(link.getAttribute("href").slice(1));
      const panel = target?.closest(".panel");
      if (!panel || panel.hidden || !panel.offsetParent) return;
      event.preventDefault();
      panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  });

  // After signing in, move focus from the (now hidden) form to the account heading.
  new MutationObserver(() => {
    if (document.body.dataset.auth === "in" && card.contains(document.activeElement)) {
      const heading = document.querySelector("#signed-in-label");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ["data-auth"] });
})();
