// Share-packet PDF: a real, valid PDF with every lab, the summary and exactly 3 questions;
// nothing invented; blocked while a number read from a photo is unconfirmed.
// Usage: serve the site on :4173, then node scripts/eval/share-packet-pdf.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
import fs from 'node:fs';
import os from 'node:os';
const base = process.env.CAREWISE_EVAL_URL || 'http://localhost:4173/';
const b = await chromium.launch(); let ok = true; const errs = [];
const check = (c, m) => { ok &&= !!c; console.log(c ? 'ok  ' : 'FAIL', m); };
for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const ctx = await b.newContext({ viewport: vp, acceptDownloads: true, serviceWorkers: 'block' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(base, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.showCareWiseSection === 'function');
  await p.evaluate(() => window.showCareWiseSection('report-title', false));
  await p.fill('#report-text', fs.readFileSync('docs/pilot-sample-labs/sample-2-thyroid-kidney.txt', 'utf8'));
  await p.click('#analyze-report'); await p.waitForSelector('#report-results .report-summary');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-report-action="packet-pdf"]')]);
  const path = `${os.tmpdir()}/share-packet-${vp.width}.pdf`; await dl.saveAs(path);
  const bytes = fs.readFileSync(path);
  check(dl.suggestedFilename().endsWith('.pdf') && bytes.slice(0, 8).toString() === '%PDF-1.4', `[${vp.width}] downloads ${dl.suggestedFilename()} (${bytes.length} bytes)`);
  // Read it back with the site's own PDF reader (pdf.js).
  const text = await p.evaluate(async (b64) => {
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return extractPdfText(new File([raw], 'x.pdf', { type: 'application/pdf' }));
  }, bytes.toString('base64'));
  const flat = text.replace(/\s+/g, ' ');
  for (const t of ['TSH', 'Free T4', 'Creatinine', 'eGFR', 'Vitamin B12', 'Sodium', 'Hemoglobin']) check(flat.includes(t), `[${vp.width}] PDF lists ${t}`);
  check(/Far above/.test(flat), `[${vp.width}] TSH status reads "Far above" in the PDF`);
  check(/Summary/.test(flat) && /Top questions for the visit/.test(flat), `[${vp.width}] has the summary and top questions`);
  const q = (flat.match(/Top questions for the visit(.*?)Educational summary only/) || [])[1] || '';
  check((q.match(/\b[123]\. /g) || []).length === 3 && !/\b4\. /.test(q), `[${vp.width}] exactly 3 questions`);
  check(!/folate/i.test(flat), `[${vp.width}] nothing invented (no folate)`);
  check(/Verify every value against the original/.test(flat), `[${vp.width}] carries the verify-against-original notice`);
  // Unconfirmed photo numbers block the PDF like every other export.
  await p.evaluate(() => showOcrResult("Sample Lab\nCalcium 240 mmol/L 2.20-2.60\nSodium 140 mmol/L 135-145", "photo"));
  await p.waitForTimeout(400);
  let got = false; p.once('download', () => { got = true; });
  await p.locator('[data-report-action="packet-pdf"]').first().evaluate(el => el.click()); await p.waitForTimeout(600);
  check(!got && /Confirm the numbers/.test(await p.textContent('#report-status')), `[${vp.width}] blocked while a photo number is unconfirmed`);
  await ctx.close();
}
check(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
await b.close();
if (!ok) { console.error('Share-packet PDF checks failed'); process.exit(1); }
console.log('All share-packet PDF checks passed');
