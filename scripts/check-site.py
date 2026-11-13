#!/usr/bin/env python3
"""Check indexing essentials, schema syntax, page titles, and local links."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://membrane-health.com"
SKIP = {"404.html"}

class Scan(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.in_title = False
        self.metas = {}
        self.canonical = None
        self.h1 = 0
        self.hrefs = []
        self.ldjson = []
        self.in_json = False
        self.json_buffer = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.h1 += 1
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.metas[key] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "a" and "href" in a:
            self.hrefs.append(a["href"])
        if tag == "script" and a.get("type") == "application/ld+json":
            self.in_json = True
            self.json_buffer = ""

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_json:
            self.json_buffer += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_json:
            self.ldjson.append(self.json_buffer)
            self.in_json = False

def canonical_for(path):
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return BASE + "/"
    if rel.endswith("/index.html"):
        return BASE + "/" + rel[:-10]
    return BASE + "/" + rel

def run():
    errors = []
    pages = sorted(p for p in ROOT.rglob("*.html") if not any(part.startswith(".") for part in p.relative_to(ROOT).parts) and p.relative_to(ROOT).as_posix() not in SKIP and p.relative_to(ROOT).parts[0] != "preview")
    titles = {}
    for page in pages:
        name = page.relative_to(ROOT).as_posix()
        scan = Scan()
        scan.feed(page.read_text(encoding="utf-8"))
        if not scan.title.strip():
            errors.append(name + ": missing title")
        elif scan.title.strip() in titles:
            errors.append(name + ": duplicate title with " + titles[scan.title.strip()])
        titles[scan.title.strip()] = name
        if len(scan.metas.get("description", "").strip()) < 50:
            errors.append(name + ": missing or short meta description")
        if scan.canonical != canonical_for(page):
            errors.append(name + ": incorrect or missing canonical: " + str(scan.canonical))
        if scan.h1 != 1:
            errors.append(name + ": expected exactly one h1, found " + str(scan.h1))
        for block in scan.ldjson:
            try:
                json.loads(block)
            except json.JSONDecodeError as e:
                errors.append(name + ": invalid JSON-LD: " + str(e))
        # New educational pages have a strict local-link check; existing long-form legacy pages
        # are included above for metadata without changing their historical anchor conventions.
        if name.startswith("understand/"):
            for href in scan.hrefs:
                u = urlsplit(href)
                if u.scheme or u.netloc or href.startswith(("mailto:", "tel:", "#")):
                    continue
                clean = unquote(u.path)
                if not clean:
                    continue
                target = (page.parent / clean).resolve()
                if not target.is_relative_to(ROOT):
                    errors.append(name + ": link escapes site: " + href)
                    continue
                if target.is_dir():
                    target /= "index.html"
                if not target.exists():
                    errors.append(name + ": broken local link " + href)
    if not (ROOT / "robots.txt").read_text(encoding="utf-8").find(BASE + "/sitemap.xml") >= 0:
        errors.append("robots.txt: missing sitemap declaration")
    result = subprocess.run([sys.executable, str(ROOT / "scripts" / "build-sitemap.py"), "--check"], cwd=ROOT)
    if result.returncode:
        errors.append("sitemap.xml is stale or malformed")
    if errors:
        print("Site quality check FAILED:")
        for err in errors:
            print(" - " + err)
        return 1
    print("Site quality check passed (" + str(len(pages)) + " public HTML pages, " + str(sum(p.relative_to(ROOT).as_posix().startswith("understand/") for p in pages)) + " educational pages).")
    return 0

if __name__ == "__main__":
    sys.exit(run())
