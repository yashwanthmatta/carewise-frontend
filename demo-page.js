// Checklist progress is a per-browser convenience only; the page works without storage.
(function () {
  const boxes = Array.from(document.querySelectorAll(".dm-steps input"));
  const progress = document.getElementById("dm-progress");
  const done = document.getElementById("dm-done");
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem("ftDemoSteps") || "[]"); } catch (e) { saved = []; }
  boxes.forEach(function (box) { box.checked = saved.indexOf(box.id) !== -1; });
  function update() {
    const checked = boxes.filter(function (box) { return box.checked; });
    progress.textContent = checked.length + " of " + boxes.length + " done";
    done.hidden = checked.length !== boxes.length;
    try { localStorage.setItem("ftDemoSteps", JSON.stringify(checked.map(function (box) { return box.id; }))); } catch (e) {}
  }
  boxes.forEach(function (box) { box.addEventListener("change", update); });
  update();
})();
