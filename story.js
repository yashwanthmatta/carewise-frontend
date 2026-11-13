// "Watch it work": a six-step animated walk through a synthetic report. It starts when the section
// scrolls into view, moves on every few seconds, and can be paused or stepped through by hand.
// With reduced motion it does not play by itself and every step is shown at once.
(() => {
  const root = document.querySelector("[data-story]");
  if (!root) return;
  const canvas = root.querySelector(".story-canvas");
  const steps = [...root.querySelectorAll("[data-story-step]")];
  const play = root.querySelector("[data-story-play]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const LAST = steps.length;
  let step = 1;
  let timer = null;
  let playing = !reduced.matches;
  let visible = false;

  function show(next) {
    step = next;
    canvas.dataset.step = String(step);
    steps.forEach((button) => {
      if (Number(button.dataset.storyStep) === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  function start() {
    stop();
    if (!playing || !visible) return;
    timer = setInterval(() => show(step >= LAST ? 1 : step + 1), 2600);
  }
  function setPlaying(on) {
    playing = on;
    play.setAttribute("aria-pressed", String(on));
    play.textContent = on ? "Pause" : "Play";
    start();
  }

  steps.forEach((button) => button.addEventListener("click", () => {
    show(Number(button.dataset.storyStep));
    setPlaying(false);
  }));
  play.addEventListener("click", () => setPlaying(!playing));
  const applyMotion = () => {
    root.classList.toggle("story-static", reduced.matches);
    if (reduced.matches) {
      show(LAST);
      setPlaying(false);
    }
  };
  reduced.addEventListener?.("change", applyMotion);
  applyMotion();
  // Only play while on screen, so it does not run (or use battery) out of view. The demo panel is
  // watched, not the whole section, and it starts once its top edge is clearly on screen (above the
  // bottom 15%): on a phone the panel is taller than the screen, so a share of it is the wrong test.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      start();
    }, { threshold: 0, rootMargin: "0px 0px -15% 0px" }).observe(root.querySelector(".story-stage") || root);
  } else {
    visible = true;
    start();
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  setPlaying(playing);
})();

// FAQ: one answer opens at a time; buttons carry aria-expanded and the answer is a labelled region.
(() => {
  const list = document.querySelector("[data-faq]");
  if (!list) return;
  const buttons = [...list.querySelectorAll("button[aria-controls]")];
  const setOpen = (button, open) => {
    button.setAttribute("aria-expanded", String(open));
    button.closest(".faq-item").classList.toggle("is-open", open);
  };
  buttons.forEach((button) => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    buttons.forEach((other) => setOpen(other, other === button && open));
  }));
})();
