#!/usr/bin/env python3
"""Build a deterministic in-browser search index from published article metadata."""
from pathlib import Path
from html import unescape
import argparse
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "understand"
OUTPUT = ARTICLES / "search-index.json"
HUBS = {"index.html", "questions.html"}
QUESTION_SLUGS = {
    "tired-after-eight-hours-sleep", "low-hrv-apple-watch",
    "how-to-know-if-recovering", "why-wearable-readings-change",
}

def clean(raw: str) -> str:
    return " ".join(unescape(re.sub(r"<[^>]*>", " ", raw)).split())

def required(pattern: str, contents: str, path: Path) -> str:
    match = re.search(pattern, contents, flags=re.DOTALL)
    if not match:
        raise ValueError(f"{path.name}: missing search metadata for {pattern}")
    return clean(match.group(1))

def records():
    items = []
    for path in sorted(ARTICLES.glob("*.html")):
        if path.name in HUBS:
            continue
        contents = path.read_text(encoding="utf-8")
        article = re.search(r'<article class="learn-article">([\s\S]*?)</article>', contents)
        if not article:
            raise ValueError(f"{path.name}: missing main educational article")
        items.append({
            "path": path.name,
            "title": required(r'<h1[^>]*>([\s\S]*?)</h1>', contents, path),
            "description": required(r'<meta name="description" content="([^"]+)"', contents, path),
            "category": required(r'<main[\s\S]*?<p class="eyebrow">([\s\S]*?)</p>', contents, path),
            "sections": [clean(x) for x in re.findall(r'<h2[^>]*>([\s\S]*?)</h2>', article.group(1))],
            "type": "question" if path.stem in QUESTION_SLUGS else "foundation",
        })
    if len(items) != len({item["path"] for item in items}):
        raise ValueError("Duplicate article search paths")
    return items

def render():
    return json.dumps(records(), indent=2, ensure_ascii=False) + "\n"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != expected:
            print("Stale educational search index. Run: python3 scripts/build-search-index.py", file=sys.stderr)
            return 1
        print(f"Educational search index current ({len(records())} articles).")
    else:
        OUTPUT.write_text(expected, encoding="utf-8")
        print(f"Wrote {OUTPUT} ({len(records())} articles).")
    return 0

if __name__ == "__main__":
    sys.exit(main())
