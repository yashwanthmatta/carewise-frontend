// Help chat and plans. Loaded after script.js and uses its shared helpers
// (apiGet, apiPost, authToken, backendFeatures, reportLanguage, escapeHtml).

(() => {
  const HELP_TEXT = {
    en: {
      sub: "Ask about your report or how to use CareWise.",
      hello: "Hi, I'm the CareWise helper. Ask me what a test on your report means, how to use the app, or about plans.",
      placeholder: "Type a question",
      send: "Send",
      share: "Share my latest result with the helper",
      fine: "General help, not medical advice. In an emergency call 911.",
      thinking: "Thinking…",
      chips: ["What does my result mean?", "How do I upload a report?", "What should I ask my doctor?", "How do plans and payments work?"],
      emergency: "This sounds urgent. Please call 911 or your local emergency number now, or go to the nearest emergency room. Do not wait for an app.",
      busy: "The helper is busy right now. Please try again in a minute.",
    },
    es: {
      sub: "Pregunta sobre tu informe o cómo usar CareWise.",
      hello: "Hola, soy el asistente de CareWise. Pregúntame qué significa una prueba de tu informe, cómo usar la app o sobre los planes.",
      placeholder: "Escribe una pregunta",
      send: "Enviar",
      share: "Compartir mi último resultado con el asistente",
      fine: "Ayuda general, no consejo médico. En una emergencia llama al 911.",
      thinking: "Pensando…",
      chips: ["¿Qué significa mi resultado?", "¿Cómo subo un informe?", "¿Qué le pregunto a mi médico?", "¿Cómo funcionan los planes y pagos?"],
      emergency: "Esto suena urgente. Llama al 911 o al número de emergencias local ahora, o ve a la sala de emergencias más cercana. No esperes a una app.",
      busy: "El asistente está ocupado. Inténtalo de nuevo en un minuto.",
    },
  };

  const EMERGENCY_PATTERN = /(chest pain|can'?t breathe|cannot breathe|trouble breathing|short of breath|stroke|face droop|slurred speech|passed out|unconscious|fainted|seizure|severe bleeding|bleeding (a lot|heavily)|overdose|suicid|kill myself|end my life|self[- ]harm|dolor (de|en el) pecho|no puedo respirar|derrame|desmay|convulsi|sangrado (fuerte|abundante)|suicid|quitarme la vida)/i;

  // Built-in answers for when the online helper is off or unreachable.
  const OFFLINE_ANSWERS = {
    en: [
      [/upload|photo|pdf|scan|add.*report|how.*start/i, "Open Upload, add a PDF, a photo or paste the report text, choose whose report it is, then press \"Explain report\". Text PDFs and photos are read on your device."],
      [/plan|price|pay|cost|cancel|subscri|plus|family|stripe|card/i, "Free covers explaining reports, the doctor brief and your health record. Plus is $7 a month for personal plans, reminders and trends. Family is $12 a month for up to 5 people. Choose a plan in Profile; you can cancel any time with \"Manage or cancel plan\"."],
      [/brief|doctor|ask|question|visit/i, "After a report is explained, the result lists questions to ask your doctor. \"Doctor brief\" makes a one-page summary you can print or share at the visit."],
      [/account|sign|log ?in|password|save|sync/i, "Go to Profile to create a free account with your email. Then press \"Save to my account\" under a report to keep it. Password reset is under \"Log out, verify email or reset password\"."],
      [/privacy|delete|data|safe|secure|share/i, "Reports are read on your device. When you save to an account, report text is encrypted. You can ask to delete your data from Profile."],
      [/spanish|español|language/i, "Pick Español in the language menu on a result to read it in Spanish. The Spanish text is still being reviewed."],
      [/mean|result|high|low|normal|range|test|value/i, "Your result lists each test in plain words and marks what needs attention first. Open \"All tests\" for every value with its range. Your doctor is the right person to say what it means for you."],
    ],
    es: [
      [/subir|foto|pdf|informe|empez/i, "Abre Subir, agrega un PDF, una foto o pega el texto del informe, elige de quién es y pulsa \"Explicar informe\"."],
      [/plan|precio|pag|costo|cancel|suscri/i, "Gratis incluye explicar informes, el resumen para el médico y tu historial. Plus cuesta $7 al mes y Familia $12 al mes para hasta 5 personas. Elige un plan en Perfil y cancela cuando quieras."],
      [/médico|medico|pregunt|cita|resumen/i, "Después de explicar un informe verás preguntas para tu médico. \"Doctor brief\" crea un resumen de una página para imprimir o compartir."],
      [/cuenta|contraseña|guardar|iniciar/i, "Ve a Perfil para crear una cuenta gratis con tu correo y guarda tus informes."],
      [/significa|resultado|alto|bajo|normal|rango|prueba/i, "Tu resultado explica cada prueba con palabras simples y marca primero lo que necesita atención. Tu médico es quien puede decir qué significa para ti."],
    ],
  };

  const lang = () => (typeof reportLanguage !== "undefined" && reportLanguage === "es" ? "es" : "en");
  const text = () => HELP_TEXT[lang()];
  const byId = (id) => document.getElementById(id);

  // ---------- Help chat ----------
  const root = byId("help-chat");
  const panel = byId("help-chat-panel");
  const openButton = byId("help-chat-open");
  const closeButton = byId("help-chat-close");
  const log = byId("help-chat-log");
  const chips = byId("help-chat-chips");
  const form = byId("help-chat-form");
  const input = byId("help-chat-input");
  const sendButton = byId("help-chat-send");
  const shareRow = byId("help-chat-share-row");
  const shareBox = byId("help-chat-share");

  const conversation = [];
  let waiting = false;

  function addBubble(role, message, extraClass = "") {
    const bubble = document.createElement("div");
    bubble.className = `help-chat-msg help-chat-${role} ${extraClass}`.trim();
    bubble.innerHTML = escapeHtml(message).replace(/\n/g, "<br>");
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function renderChips() {
    chips.innerHTML = "";
    if (conversation.length) return;
    text().chips.forEach((label) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "help-chat-chip";
      chip.textContent = label;
      chip.addEventListener("click", () => ask(label));
      chips.appendChild(chip);
    });
  }

  function refreshChatText() {
    const t = text();
    byId("help-chat-sub").textContent = t.sub;
    input.placeholder = t.placeholder;
    sendButton.textContent = t.send;
    byId("help-chat-share-label").textContent = t.share;
    byId("help-chat-fine").textContent = t.fine;
    const hasResult = typeof latestReportSummaryPack !== "undefined" && Boolean(latestReportSummaryPack);
    shareRow.hidden = !hasResult;
    if (!hasResult) shareBox.checked = false;
    if (!log.childElementCount) addBubble("assistant", t.hello, "help-chat-hello");
    renderChips();
  }

  function offlineAnswer(question) {
    const match = OFFLINE_ANSWERS[lang()].find(([pattern]) => pattern.test(question));
    if (match) return match[1];
    return lang() === "es"
      ? "No tengo una respuesta para eso. Prueba con otra pregunta, o usa el cuadro \"¿Te ayudó?\" para escribir al equipo."
      : "I don't have an answer for that one. Try asking another way, or use the \"Was this helpful?\" box to reach the CareWise team.";
  }

  function setOpen(open) {
    panel.hidden = !open;
    root.classList.toggle("open", open);
    openButton.setAttribute("aria-expanded", String(open));
    if (open) {
      refreshChatText();
      setTimeout(() => input.focus(), 30);
    } else {
      openButton.focus();
    }
  }

  async function ask(question) {
    const clean = question.trim().slice(0, 1000);
    if (!clean || waiting) return;
    addBubble("user", clean);
    conversation.push({ role: "user", content: clean });
    input.value = "";
    renderChips();

    if (EMERGENCY_PATTERN.test(clean)) {
      addBubble("assistant", text().emergency, "help-chat-urgent");
      conversation.push({ role: "assistant", content: text().emergency });
      return;
    }

    waiting = true;
    sendButton.disabled = true;
    const pending = addBubble("assistant", text().thinking, "help-chat-pending");
    let reply = "";
    try {
      if (backendFeatures && backendFeatures.help_assistant === false) throw new Error("Backend returned 503");
      const response = await apiPost("/assistant/chat", {
        messages: conversation.slice(-12),
        report_summary: shareBox.checked && typeof latestReportSummaryPack === "string" ? latestReportSummaryPack.slice(0, 4000) : "",
        language: lang(),
        source: "web",
      }, { skipAuth: true });
      reply = response.reply;
    } catch (error) {
      reply = /429/.test(String(error && error.message)) ? text().busy : offlineAnswer(clean);
    }
    pending.remove();
    addBubble("assistant", reply);
    conversation.push({ role: "assistant", content: reply });
    waiting = false;
    sendButton.disabled = false;
  }

  if (root) {
    openButton.addEventListener("click", () => setOpen(panel.hidden));
    closeButton.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) setOpen(false);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      ask(input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        ask(input.value);
      }
    });
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open-help]");
      if (!opener) return;
      event.preventDefault();
      setOpen(true);
    });
    window.openCareWiseHelp = () => setOpen(true);
  }

  // ---------- Plans and payments ----------
  const billingPanel = document.querySelector(".billing-panel");
  const billingStatus = byId("billing-status");
  const billingBadge = byId("billing-current");
  const billingBanner = byId("billing-banner");
  const manageButton = byId("manage-billing");
  const PLAN_NAMES = { basic: "Free", plus: "Plus", premium: "Family" };
  let currentPlan = { plan_code: "basic", status: "free", payments_enabled: false, can_manage_billing: false };

  function paymentsEnabled() {
    return Boolean(currentPlan.payments_enabled || (typeof backendFeatures !== "undefined" && backendFeatures.stripe_checkout));
  }

  function renderPlan() {
    if (!billingPanel) return;
    const signedIn = Boolean(authToken);
    const activePaid = currentPlan.plan_code !== "basic";
    billingBadge.textContent = `${PLAN_NAMES[currentPlan.plan_code] || "Free"} plan${currentPlan.status === "past_due" ? " · payment due" : ""}`;
    billingBadge.className = `sync-badge ${activePaid ? "online" : ""}`.trim();
    billingPanel.querySelectorAll("[data-plan-card]").forEach((card) => {
      const code = card.dataset.planCard;
      const isCurrent = code === currentPlan.plan_code;
      card.classList.toggle("billing-card-current", isCurrent);
      const button = card.querySelector("[data-choose-plan]");
      if (code === "basic") {
        button.textContent = isCurrent ? "Your plan" : "Included";
        button.disabled = true;
        return;
      }
      button.disabled = isCurrent;
      button.textContent = isCurrent ? "Your plan" : !signedIn ? `Sign in to choose ${PLAN_NAMES[code]}` : `Choose ${PLAN_NAMES[code]}`;
    });
    manageButton.hidden = !currentPlan.can_manage_billing;
  }

  async function refreshPlan() {
    if (!billingPanel) return;
    if (!authToken) {
      currentPlan = { plan_code: "basic", status: "free", payments_enabled: false, can_manage_billing: false };
      renderPlan();
      return;
    }
    try {
      currentPlan = await apiGet("/subscriptions/me");
    } catch {
      // Keep what we had; the backend may be waking up.
    }
    renderPlan();
  }

  function showPlans() {
    if (typeof window.showCareWiseSection === "function") window.showCareWiseSection("account-title", false);
    setTimeout(() => billingPanel && billingPanel.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function choosePlan(code) {
    if (code === "basic" || !PLAN_NAMES[code]) return;
    if (!authToken) {
      billingStatus.textContent = `Create a free account or log in above, then choose ${PLAN_NAMES[code]}.`;
      const email = byId("auth-email");
      if (email) {
        email.scrollIntoView({ behavior: "smooth", block: "center" });
        email.focus({ preventScroll: true });
      }
      return;
    }
    if (!paymentsEnabled()) {
      billingStatus.innerHTML = `Payments for ${PLAN_NAMES[code]} open soon. <a href="#early-access-title" data-early-access-link>Join early access</a> and we will email you when it starts. Free keeps working in the meantime.`;
      return;
    }
    billingStatus.textContent = "Opening secure Stripe checkout…";
    try {
      const response = await apiPost("/subscriptions/checkout", { plan_code: code, payment_provider: "stripe" });
      if (typeof response.checkout_url === "string" && response.checkout_url.startsWith("https://checkout.stripe.com/")) {
        window.location.assign(response.checkout_url);
        return;
      }
      billingStatus.textContent = "Checkout is not ready yet. Please try again later.";
    } catch {
      billingStatus.textContent = "Checkout could not open. Check your connection and try again.";
    }
  }

  async function manageBilling() {
    billingStatus.textContent = "Opening your Stripe billing page…";
    try {
      const response = await apiPost("/subscriptions/portal", {});
      if (typeof response.portal_url === "string" && response.portal_url.startsWith("https://billing.stripe.com/")) {
        window.location.assign(response.portal_url);
        return;
      }
      billingStatus.textContent = "The billing page is not available right now.";
    } catch {
      billingStatus.textContent = "The billing page could not open. Please try again.";
    }
  }

  function handleReturnFromStripe() {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (result !== "success" && result !== "cancelled") return;
    billingBanner.hidden = false;
    billingBanner.className = `billing-banner ${result === "success" ? "ok" : ""}`.trim();
    billingBanner.textContent = result === "success"
      ? "Thank you. Your payment went through and your plan is switching on. It can take a minute to show here."
      : "Checkout was cancelled. Nothing was charged.";
    params.delete("checkout");
    const query = params.toString();
    history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}#account-title`);
    showPlans();
    if (result === "success") {
      refreshPlan();
      setTimeout(refreshPlan, 8000);
    }
  }

  if (billingPanel) {
    document.addEventListener("click", (event) => {
      const chooser = event.target.closest("[data-choose-plan]");
      if (!chooser) return;
      const code = chooser.dataset.choosePlan;
      if (chooser.closest(".billing-panel")) {
        choosePlan(code);
        return;
      }
      // Pricing cards on the home page: open Profile at the plans.
      event.preventDefault();
      showPlans();
      if (authToken) choosePlan(code);
      else billingStatus.textContent = `Create a free account or log in above, then choose ${PLAN_NAMES[code] || "a plan"}.`;
    });
    manageButton.addEventListener("click", manageBilling);
    // Refresh when Profile opens and when someone signs in or out.
    new MutationObserver(() => {
      if (!billingPanel.hidden) refreshPlan();
    }).observe(billingPanel, { attributes: true, attributeFilter: ["hidden"] });
    const authBadge = byId("auth-badge");
    if (authBadge) new MutationObserver(refreshPlan).observe(authBadge, { childList: true, characterData: true, subtree: true });
    renderPlan();
    handleReturnFromStripe();
    if (!billingPanel.hidden) refreshPlan();
  }
})();
