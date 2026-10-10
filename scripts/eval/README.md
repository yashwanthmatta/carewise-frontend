# Report reading accuracy test

Twelve made-up lab reports (no real patient data) in four common layouts: a plain
table, Quest-style, LabCorp-style and a simple list. Each test has a known value and a
known answer (high, low or in range). `run-eval.mjs` opens the site, reads every PDF
with the site's own PDF reader and explainer, and scores:

- **read rate**: tests found at all
- **value accuracy**: the number read matches the report
- **flag accuracy**: high / low / in range matches the lab's own printed range

```
python3 -m http.server 4173 &            # from the repo root
node scripts/eval/run-eval.mjs            # exits 1 if anything is wrong
node scripts/eval/build-pdfs.mjs          # only after editing cases.json
```

CI runs it on every pull request. To add a case, add it to `cases.json`, rebuild the
PDFs and commit both.
