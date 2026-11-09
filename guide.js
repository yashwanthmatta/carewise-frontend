// AI Health Guide on the homepage: an illustrated, animated education guide that answers through
// the same pipeline as the help chat (help.js: emergency words, fixed "not a doctor" and
// "can't diagnose" answers, the online helper, built-in answers when it is not there).
// States shown by the avatar: idle, listening (typing), thinking (waiting), speaking (answer
// appearing or being read aloud), then back to idle. Reduced motion: no movement, same states in words.
(() => {
  const box = document.querySelector("[data-guide]");
  const avatar = document.querySelector("[data-guide-avatar]");
  if (!box || !avatar) return;
  const log = box.querySelector("[data-guide-log]");
  const form = box.querySelector("[data-guide-form]");
  const input = form.querySelector("input");
  const submit = form.querySelector('button[type="submit"]');
  const chips = box.querySelector("[data-guide-chips]");
  const share = box.querySelector("[data-guide-share]");
  const stateText = document.querySelector("[data-guide-state]");
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
  const history = [];
  let busy = false;

  const STATES = {
    idle: "Ready for your question",
    listening: "Listening to your question",
    thinking: "Thinking",
    speaking: "Answering",
    reading: "Reading the answer aloud",
  };
  function setState(name) {
    avatar.className = `guide-avatar is-${name}`;
    avatar.dataset.state = name;
    if (stateText) stateText.textContent = STATES[name] || "";
  }

  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function addMessage(role, html, extra = "") {
    const item = document.createElement("div");
    item.className = `guide-msg guide-msg-${role} ${extra}`.trim();
    item.innerHTML = html;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
    return item;
  }

  // Reveal the answer word by word, so the guide visibly "speaks"; instant with reduced motion.
  function reveal(target, text) {
    return new Promise((resolve) => {
      const words = text.split(/(\s+)/);
      if (reduced() || words.length < 4) {
        target.innerHTML = escape(text).replace(/\n/g, "<br>");
        resolve();
        return;
      }
      let shown = 0;
      const step = Math.max(1, Math.round(words.length / 45));
      const timer = setInterval(() => {
        shown = Math.min(words.length, shown + step);
        target.innerHTML = escape(words.slice(0, shown).join("")).replace(/\n/g, "<br>");
        log.scrollTop = log.scrollHeight;
        if (shown >= words.length) {
          clearInterval(timer);
          resolve();
        }
      }, 30);
    });
  }

  function stopReading() {
    if (canSpeak) window.speechSynthesis.cancel();
    log.querySelectorAll("[data-guide-listen]").forEach((button) => {
      button.textContent = "Listen";
      button.setAttribute("aria-pressed", "false");
    });
    if (!busy) setState("idle");
  }

  function readAloud(button, text) {
    if (!canSpeak) return;
    if (button.getAttribute("aria-pressed") === "true") {
      stopReading();
      return;
    }
    stopReading();
    const utterance = new SpeechSynthesisUtterance(text.replace(/•/g, ""));
    utterance.lang = document.documentElement.lang === "es" ? "es-US" : "en-US";
    utterance.rate = 0.95;
    utterance.onend = stopReading;
    utterance.onerror = stopReading;
    button.textContent = "Stop";
    button.setAttribute("aria-pressed", "true");
    setState("reading");
    window.speechSynthesis.speak(utterance);
  }

  const SOURCES = {
    online: "Source: an AI answer from our provider, Anthropic, under FollowThrough Health's safety rules.",
    "built-in": "Source: FollowThrough Health's built-in explanations.",
    safety: "Source: FollowThrough Health's emergency safety message.",
  };

  async function ask(question) {
    const clean = String(question || "").trim().slice(0, 1000);
    if (!clean || busy) return;
    busy = true;
    submit.disabled = true;
    stopReading();
    addMessage("you", `<p>${escape(clean)}</p>`);
    history.push({ role: "user", content: clean });
    input.value = "";
    setState("thinking");
    const pending = addMessage("guide", '<p class="guide-typing" aria-label="Thinking"><span></span><span></span><span></span></p>', "guide-pending");
    let answer;
    try {
      answer = typeof window.careWiseGuideReply === "function"
        ? await window.careWiseGuideReply(clean, history, Boolean(share?.querySelector("input")?.checked))
        : { reply: "The guide could not load. Please refresh the page and try again.", source: "built-in" };
    } catch {
      answer = { reply: "The guide could not answer just now. Please try again in a minute.", source: "built-in" };
    }
    pending.remove();
    history.push({ role: "assistant", content: answer.reply });
    const item = addMessage("guide", "<p></p>", answer.urgent ? "guide-urgent" : "");
    setState("speaking");
    await reveal(item.querySelector("p"), answer.reply);
    const tools = document.createElement("div");
    tools.className = "guide-tools";
    tools.innerHTML = `${canSpeak ? '<button type="button" data-guide-listen aria-pressed="false">Listen</button>' : ""}<button type="button" data-guide-copy>Copy</button><a href="glossary.html">Lab test glossary</a><a href="safety.html">How we keep it safe</a>`;
    item.appendChild(tools);
    const source = document.createElement("p");
    source.className = "guide-source";
    source.textContent = SOURCES[answer.source] || SOURCES["built-in"];
    item.appendChild(source);
    tools.querySelector("[data-guide-listen]")?.addEventListener("click", (event) => readAloud(event.currentTarget, answer.reply));
    tools.querySelector("[data-guide-copy]").addEventListener("click", async (event) => {
      try {
        await navigator.clipboard.writeText(answer.reply);
        event.currentTarget.textContent = "Copied";
      } catch {
        event.currentTarget.textContent = "Select the text to copy";
      }
    });
    busy = false;
    submit.disabled = false;
    setState("idle");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });
  chips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-guide-ask]");
    if (chip) ask(chip.textContent);
  });
  input.addEventListener("focus", () => { if (!busy) setState("listening"); });
  input.addEventListener("input", () => { if (!busy) setState(input.value ? "listening" : "idle"); });
  input.addEventListener("blur", () => { if (!busy && !input.value) setState("idle"); });
  const refreshShare = () => {
    if (share) share.hidden = !(typeof window.careWiseHasReport === "function" && window.careWiseHasReport());
  };
  refreshShare();
  document.addEventListener("visibilitychange", refreshShare);
  window.addEventListener("hashchange", refreshShare);
  window.careWiseGuideAsk = ask;
  setState("idle");
})();
