#!/usr/bin/env python3
"""Deterministically generate the public HTML sitemap for GitHub Pages."""
from pathlib import Path
import argparse
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://membrane-health.com"
EXCLUDED = {"404.html"}
# Preview copies are published for review only and must never appear in the public sitemap.

def url_for(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    if relative == "index.html":
        return BASE + "/"
    if relative.endswith("/index.html"):
        return BASE + "/" + relative[:-10]
    return BASE + "/" + relative

def public_html():
    paths = [p for p in ROOT.rglob("*.html") if p.relative_to(ROOT).as_posix() not in EXCLUDED and p.relative_to(ROOT).parts[0] != "preview" and not any(part.startswith(".") for part in p.relative_to(ROOT).parts)]
    return sorted(paths, key=lambda p: (p != ROOT / "index.html", p.relative_to(ROOT).as_posix()))

def render() -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in public_html():
        lines.append("  <url><loc>" + url_for(path) + "</loc></url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if sitemap.xml is out of date")
    args = parser.parse_args()
    file = ROOT / "sitemap.xml"
    expected = render()
    if args.check:
        if not file.exists() or file.read_text(encoding="utf-8") != expected:
            print("sitemap.xml needs regeneration: python3 scripts/build-sitemap.py", file=sys.stderr)
            sys.exit(1)
        ET.fromstring(expected)
        print("Sitemap is current (" + str(len(public_html())) + " pages).")
    else:
        file.write_text(expected, encoding="utf-8")
        print("Wrote " + str(file))
