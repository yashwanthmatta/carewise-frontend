document.getElementById("gl-q").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll(".gl-item").forEach((item) => { item.hidden = q && !item.textContent.toLowerCase().includes(q); });
});
