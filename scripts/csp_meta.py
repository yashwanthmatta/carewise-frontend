"""Keep a Content-Security-Policy <meta> tag in every page, derived from render.yaml.

The live static site does not apply render.yaml's response headers (the production monitor found
only 1 of 4 security headers served), so each page carries the policy itself. A <meta> policy can't
use frame-ancestors (header only), and upgrade-insecure-requests would break local http testing,
so both are left out here; everything else is identical to the header.

Usage: python3 scripts/csp_meta.py          (update the pages)
       python3 scripts/csp_meta.py --check  (CI: fail if a page is missing or out of date)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META_DROP = ("frame-ancestors", "upgrade-insecure-requests")


def header_policy() -> str:
    text = (ROOT / "render.yaml").read_text()
    match = re.search(r'name: Content-Security-Policy\n\s*value: "([^"]+)"', text)
    if not match:
        raise SystemExit("render.yaml has no Content-Security-Policy header")
    return match.group(1)


def meta_policy() -> str:
    parts = [p.strip() for p in header_policy().split(";") if p.strip()]
    return "; ".join(p for p in parts if not p.startswith(META_DROP))


def meta_tag() -> str:
    return f'<meta http-equiv="Content-Security-Policy" content="{meta_policy()}" />'


def pages() -> list[Path]:
    return sorted(list(ROOT.glob("*.html")) + list((ROOT / "legal").glob("*.html")))


def apply(html: str) -> str:
    tag = meta_tag()
    html = re.sub(r'\n?[ \t]*<meta http-equiv="Content-Security-Policy"[^>]*>', "", html)
    # Right after <meta charset>, before any script or stylesheet.
    return re.sub(r'([ \t]*)(<meta charset="utf-8" ?/?>)', lambda m: f"{m.group(1)}{m.group(2)}\n{m.group(1)}{tag}", html, count=1)


def main() -> None:
    check = "--check" in sys.argv
    stale = []
    for page in pages():
        html = page.read_text()
        updated = apply(html)
        if 'http-equiv="Content-Security-Policy"' not in updated:
            stale.append(f"{page.relative_to(ROOT)} (no <meta charset> to anchor the policy)")
        elif updated != html:
            if check:
                stale.append(str(page.relative_to(ROOT)))
            else:
                page.write_text(updated)
    if stale:
        print("Content-Security-Policy <meta> missing or out of date in:\n  " + "\n  ".join(stale))
        print("Run: python3 scripts/csp_meta.py")
        raise SystemExit(1)
    print(f"Content-Security-Policy <meta> is current in {len(pages())} pages.")


if __name__ == "__main__":
    main()
