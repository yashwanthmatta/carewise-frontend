// Renders assets/og/share-card.png (1200x630), the picture shown when a
// FollowThrough Health link is shared. Edit card.html, then run:
//   node scripts/share-card/build.mjs
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "..", "assets", "og", "share-card.png");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto("file://" + path.join(here, "card.html"));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log("Wrote", path.relative(process.cwd(), out));
