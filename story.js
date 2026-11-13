// Hero: pen marks on the sample report. Each note circles its own value and, on wide screens, an
// arrow runs along the ruled line above that row to the note in the margin, so the pen never crosses a
// printed number. Positions come from the real table cells, so a circle cannot land on the wrong
// value. On phones the notes sit under the sheet, numbered to match the circles.
(() => {
  const wrap = document.querySelector("[data-annotated]");
  if (!wrap) return;
  const svg = wrap.querySelector("[data-ink]");
  const sheet = wrap.querySelector(".ed-sheet");
  const notes = [...wrap.querySelectorAll("[data-note]")];
  function draw() {
    const box = wrap.getBoundingClientRect();
    if (!box.width) return;
    const wide = window.matchMedia("(min-width: 641px)").matches;
    const paper = sheet.getBoundingClientRect();
    let d = "";
    let labels = "";
    let lastBottom = -Infinity;
    notes.forEach((note, index) => {
      const cell = wrap.querySelector(`[data-mark="${note.dataset.note}"]`);
      if (!cell) return;
      const c = cell.getBoundingClientRect();
      const text = cell.firstChild && document.createRange();
      let left = c.left;
      let width = 24;
      if (text) { text.selectNodeContents(cell); const r = text.getBoundingClientRect(); left = r.left; width = r.width; }
      const cx = left - box.left + width / 2;
      const cy = c.top - box.top + c.height / 2;
      const rx = Math.max(16, width / 2 + 8);
      const ry = Math.min(15, c.height / 2 + 2);
      // A loose loop, not a perfect ellipse: it overshoots where the pen closes it.
      d += `M${cx - rx + 4} ${cy - ry + 3} C${cx - rx - 8} ${cy + ry - 2} ${cx + rx + 10} ${cy + ry + 4} ${cx + rx + 2} ${cy - ry + 5} S${cx - rx + 6} ${cy - ry - 8} ${cx - rx - 2} ${cy - 2} `;
      if (wide) {
        const nx = paper.right - box.left + 24;
        let ny = c.top - box.top - 18;
        if (ny < lastBottom + 10) ny = lastBottom + 10;
        note.style.left = `${nx}px`;
        note.style.top = `${ny}px`;
        lastBottom = ny + note.getBoundingClientRect().height;
        const ty = ny + 14;
        const yb = c.top - box.top + 1;
        const sx = paper.right - box.left;
        d += `M${cx + rx - 2} ${cy - ry + 2} Q${cx + rx + 10} ${yb} ${cx + rx + 34} ${yb} L${sx - 14} ${yb} Q${nx - 24} ${yb} ${nx - 6} ${ty} M${nx - 15} ${ty - 8} L${nx - 5} ${ty} L${nx - 16} ${ty + 5} `;
      } else {
        note.style.left = "";
        note.style.top = "";
        labels += `<text x="${cx + rx + 6}" y="${cy - 4}">${index + 1}</text>`;
      }
    });
    svg.innerHTML = `<path d="${d}"/>${labels}`;
  }
  const redraw = () => window.requestAnimationFrame(draw);
  (document.fonts?.ready || Promise.resolve()).then(redraw);
  window.addEventListener("resize", redraw);
  if ("ResizeObserver" in window) new ResizeObserver(redraw).observe(wrap);
  redraw();
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
