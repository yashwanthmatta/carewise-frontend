"""Serve the site locally with the same response headers render.yaml sets in production.

Usage: python3 scripts/serve_with_headers.py [port] [--extra-connect "http://127.0.0.1:8000"]
--extra-connect adds origins to connect-src for local testing against a local API only.
"""
import http.server
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def production_headers() -> list[tuple[str, str]]:
    # render.yaml is simple enough to read without a YAML library (none is installed in CI).
    text = (ROOT / "render.yaml").read_text()
    pairs = re.findall(r"- path: /\*\s*\n\s*name: ([^\n]+)\n\s*value: ([^\n]+)", text)
    return [(name.strip(), value.strip().strip('"')) for name, value in pairs]


def main() -> None:
    args = sys.argv[1:]
    extra = ""
    if "--extra-connect" in args:
        index = args.index("--extra-connect")
        extra = args[index + 1]
        del args[index:index + 2]
    port = int(args[0]) if args else 4174
    headers = production_headers()
    if extra:
        headers = [(n, v.replace("connect-src ", f"connect-src {extra} ", 1)) if n == "Content-Security-Policy" else (n, v) for n, v in headers]
    # Local HTTP: the browser would upgrade requests to https and they would fail.
    headers = [(n, v.replace("; upgrade-insecure-requests", "")) for n, v in headers if n != "Strict-Transport-Security"]

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def end_headers(self):
            for name, value in headers:
                self.send_header(name, value)
            super().end_headers()

        def log_message(self, *a):
            pass

    print(f"Serving with {len(headers)} production headers on :{port}", flush=True)
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
