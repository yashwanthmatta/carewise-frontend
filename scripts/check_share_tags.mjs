// Checks that every public page has complete link-preview (Open Graph) tags,
// so a link shared on WhatsApp, Facebook or LinkedIn shows a title, a short
// description and the share picture. Run: node scripts/check_share_tags.mjs
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://followthroughhealth.com/";
const PAGES = ["index.html", "demo.html", "glossary.html", "safety.html", "faq.html", "about.html", "support.html", "accessibility.html"];
const MAX_IMAGE_BYTES = 600 * 1024; // keep previews fast on phones

const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

function meta(html, attr, key) {
  const re = new RegExp(`<meta ${attr}="${key.replace(/[:]/g, "\\:")}" content="([^"]*)"`, "g");
  return [...html.matchAll(re)].map((m) => m[1]);
}

function pngSize(file) {
  const buf = readFileSync(file);
  const sig = buf.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

for (const page of PAGES) {
  const html = readFileSync(path.join(root, page), "utf8");
  const one = (attr, key) => {
    const v = meta(html, attr, key);
    if (v.length !== 1) fail(page, `expected exactly one ${key}, found ${v.length}`);
    return v[0] || "";
  };
  for (const key of ["og:type", "og:site_name", "og:title", "og:description", "og:image:alt"]) {
    if (!one("property", key).trim()) fail(page, `${key} is empty`);
  }
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  const ogUrl = one("property", "og:url");
  if (!canonical) fail(page, "no canonical link");
  else if (ogUrl !== canonical) fail(page, `og:url (${ogUrl}) differs from canonical (${canonical})`);

  if (one("name", "twitter:card") !== "summary_large_image") fail(page, "twitter:card should be summary_large_image");
  const image = one("property", "og:image");
  if (one("name", "twitter:image") !== image) fail(page, "twitter:image should match og:image");
  if (one("property", "og:image:width") !== "1200" || one("property", "og:image:height") !== "630") fail(page, "og:image size tags should say 1200 x 630");

  if (!image.startsWith(SITE)) { fail(page, `og:image must be an absolute ${SITE} address`); continue; }
  const file = path.join(root, image.slice(SITE.length));
  if (!existsSync(file)) { fail(page, `og:image file missing: ${path.relative(root, file)}`); continue; }
  const size = pngSize(file);
  if (!size) fail(page, "og:image is not a PNG");
  else if (size.width !== 1200 || size.height !== 630) fail(page, `og:image is ${size.width}x${size.height}, expected 1200x630`);
  if (statSync(file).size > MAX_IMAGE_BYTES) fail(page, `og:image is larger than ${MAX_IMAGE_BYTES / 1024} KB`);
}

if (failures.length) {
  console.error("Share tag check failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Share tags OK on ${PAGES.length} pages.`);
