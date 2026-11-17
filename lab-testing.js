// Lab testing (planned). The catalog below is the same synthetic draft as the backend's
// app/services/lab_testing/catalog.py: plain descriptions only, no prices, no availability.
// "Find testing near you" never shows a location: there are no verified partner labs yet. It
// offers an email when testing reaches that ZIP code, through the existing early-access list.
(() => {
  const DEFAULT_API = "https://carewise-api.onrender.com";
  let api = DEFAULT_API;
  try {
    api = localStorage.getItem("carewiseApiUrl") || DEFAULT_API;
  } catch {
    api = DEFAULT_API;
  }
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const CATALOG = [
    ["Heart and cholesterol", "Fats in the blood that doctors use, with blood pressure and other risks, to judge heart health.", [
      ["Lipid panel", "The main cholesterol tests in one draw.", ["Total cholesterol", "LDL cholesterol", "HDL cholesterol", "Triglycerides"]],
    ]],
    ["Blood sugar", "How the body handles sugar, now and over the last few months.", [
      ["Glucose", "The sugar level in the blood at the time of the draw.", []],
      ["Hemoglobin A1c", "Average blood sugar over the last 2 to 3 months.", []],
    ]],
    ["Thyroid", "The signal that tells the thyroid how hard to work, and the thyroid's own hormone.", [
      ["TSH", "The brain's signal to the thyroid.", []],
      ["Free T4", "The main hormone the thyroid makes.", []],
    ]],
    ["Nutrients", "Vitamins and stored iron that are often checked when someone is tired.", [
      ["Vitamin D (25-hydroxy)", "The body's store of vitamin D.", []],
      ["Vitamin B12", "A vitamin needed for nerves and red blood cells.", []],
      ["Ferritin", "How much iron the body has stored.", []],
    ]],
    ["Kidneys", "How well the kidneys filter the blood, and the salts they balance.", [
      ["Kidney function", "Kidney filtering and the salts the kidneys balance.", ["Creatinine", "eGFR", "BUN", "Sodium", "Potassium"]],
    ]],
    ["Liver", "Enzymes and proteins that show whether the liver is irritated and how it is working.", [
      ["Liver panel", "Liver enzymes and proteins.", ["ALT", "AST", "ALP", "Bilirubin", "Albumin"]],
    ]],
    ["Blood count and iron", "Red cells, white cells and platelets, and the iron that red cells need.", [
      ["Complete blood count (CBC)", "Red cells, white cells and platelets.", ["Hemoglobin", "Hematocrit", "White blood cells", "Platelets"]],
      ["Iron panel", "Iron in the blood and the protein that carries it.", ["Iron", "TIBC", "Ferritin"]],
    ]],
  ];

  const box = document.querySelector("[data-lt-catalog]");
  if (box) {
    box.innerHTML = CATALOG.map(([name, summary, tests]) => `
      <section class="lt-cat">
        <h3>${esc(name)}</h3>
        <p>${esc(summary)}</p>
        ${tests.map(([test, measures, includes]) => `
        <details class="lt-test">
          <summary><span>${esc(test)}</span><small>Planned</small></summary>
          <dl>
            <dt>What it measures</dt><dd>${esc(measures)}</dd>
            ${includes.length ? `<dt>Includes</dt><dd>${esc(includes.join(", "))}</dd>` : ""}
            <dt>Sample</dt><dd>Blood, taken at a partner lab</dd>
            <dt>How to prepare</dt><dd>From the partner lab's own instructions, shown when you book</dd>
            <dt>Price</dt><dd>Set with partner labs and shown before you pay</dd>
            <dt>Who reviews it</dt><dd>A licensed clinician (planned)</dd>
          </dl>
        </details>`).join("")}
      </section>`).join("");
  }

  const zipForm = document.querySelector("[data-lt-zip]");
  const zipError = document.querySelector("[data-lt-zip-error]");
  const result = document.querySelector("[data-lt-zip-result]");
  const notify = document.querySelector("[data-lt-notify]");
  const status = document.querySelector("[data-lt-notify-status]");
  let zip = "";

  zipForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = zipForm.zip.value.trim();
    if (!/^\d{5}(-\d{4})?$/.test(value)) {
      zipError.hidden = false;
      zipForm.zip.setAttribute("aria-invalid", "true");
      zipForm.zip.focus();
      return;
    }
    zipError.hidden = true;
    zipForm.zip.removeAttribute("aria-invalid");
    zip = value.slice(0, 5);
    result.querySelector(".lt-zip-none").textContent = `There is no partner lab near ${zip} yet. We only show a lab once it has signed with us and we have checked it, so you won't see a list of places here.`;
    result.hidden = false;
    status.textContent = "";
  });

  notify?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = notify.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = "Please enter your email address.";
      notify.email.focus();
      return;
    }
    if (!notify.consent.checked) {
      status.textContent = "Please tick the box to agree to be emailed.";
      notify.consent.focus();
      return;
    }
    const button = notify.querySelector("button");
    button.disabled = true;
    status.textContent = "Saving…";
    try {
      const response = await fetch(`${api}/product/early-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "other", note: `Lab testing near ZIP ${zip}`, consent: true, source: "web" }),
      });
      status.textContent = response.ok
        ? `Thank you. We'll email you when lab testing is available near ${zip}.`
        : response.status === 429 ? "Too many tries. Please wait a few minutes." : "That didn't save. Please try again later.";
      if (response.ok) notify.reset();
    } catch {
      status.textContent = "FollowThrough Health could not be reached. Please try again later.";
    } finally {
      button.disabled = false;
    }
  });
})();
