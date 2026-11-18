// Photo slots (18 Nov 2026). The homepage and the dashboard have places for illustrative photographs
// of people (docs/photography-briefs.md). A photo appears only when it is listed in
// assets/photos/photos.json; until then each slot shows its own illustration, so the page never
// shows a placeholder or a stand-in photo. Every listed photo carries a visible disclosure
// ("Illustrative AI-generated image…" or the licence credit), because synthetic people must never
// pass for real patients, clinicians or partners.
(() => {
  if (!window.fetch) return;
  const DEFAULT_NOTE = "Illustrative AI-generated image. Not an actual FollowThrough patient or clinician.";
  let manifest = null;
  const load = () => {
    manifest ||= fetch("assets/photos/photos.json", { cache: "no-cache" })
      .then((response) => (response.ok ? response.json() : { photos: [] }))
      .then((data) => new Map((data.photos || []).filter((p) => p && p.slot && p.base).map((p) => [p.slot, p])))
      .catch(() => new Map());
    return manifest;
  };

  const build = (entry, eager) => {
    const figure = document.createElement("figure");
    figure.className = "fx-photo";
    const picture = document.createElement("picture");
    const widths = Array.isArray(entry.widths) && entry.widths.length ? entry.widths : [800, 1600];
    const set = (ext) => widths.map((w) => `${entry.base}-${w}.${ext} ${w}w`).join(", ");
    const sizes = entry.sizes || "(min-width: 1100px) 1100px, 100vw";
    for (const [ext, type] of [["avif", "image/avif"], ["webp", "image/webp"]]) {
      if (!(entry.formats || ["avif", "webp", "jpg"]).includes(ext)) continue;
      const source = document.createElement("source");
      source.type = type;
      source.srcset = set(ext);
      source.sizes = sizes;
      picture.append(source);
    }
    const img = document.createElement("img");
    img.src = `${entry.base}-${widths[widths.length - 1]}.jpg`;
    img.srcset = set("jpg");
    img.sizes = sizes;
    img.alt = entry.alt || "";
    if (entry.width && entry.height) { img.width = entry.width; img.height = entry.height; }
    img.decoding = "async";
    img.loading = eager ? "eager" : "lazy";
    if (eager) img.setAttribute("fetchpriority", "high");
    if (entry.position) img.style.objectPosition = entry.position;
    picture.append(img);
    const caption = document.createElement("figcaption");
    caption.className = "fx-photo-note";
    caption.textContent = entry.disclosure || DEFAULT_NOTE;
    figure.append(picture, caption);
    return { figure, img };
  };

  // Fills every empty slot inside root. Safe to call again after a part of the page is re-drawn.
  const fill = (root = document) => {
    const slots = [...root.querySelectorAll("[data-photo-slot]")].filter((slot) => !slot.querySelector(".fx-photo"));
    if (!slots.length) return Promise.resolve();
    return load().then((bySlot) => {
      slots.forEach((slot) => {
        const entry = bySlot.get(slot.dataset.photoSlot);
        if (!entry || slot.querySelector(".fx-photo")) return;
        const eager = slot.dataset.photoSlot === "hero";
        const { figure, img } = build(entry, eager);
        const show = () => slot.classList.add("has-photo");
        // A missing or broken file puts the illustration back.
        img.addEventListener("error", () => { figure.remove(); slot.classList.remove("has-photo"); }, { once: true });
        slot.prepend(figure);
        // The hero waits for its photo so the first screen never flashes an empty frame. Photos
        // further down load lazily, which needs them laid out, so their frame shows at once.
        if (!eager) show();
        else if (img.complete && img.naturalWidth) show();
        else img.addEventListener("load", show, { once: true });
      });
    });
  };
  window.ftPhotos = { fill };
  fill();
})();
