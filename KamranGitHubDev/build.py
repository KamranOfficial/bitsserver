#!/usr/bin/env python3
"""
build.py — BitsServer static site builder (dev-time only, NOT deployed)

What it does:
  1. Reads includes/header.html and includes/footer.html.
  2. Walks every *.html file in the source tree (skipping includes/ and dist/).
  3. Replaces the placeholder comments below with the shared header/footer.
  4. Writes the fully-stitched, plain static HTML to /dist, mirroring the
     source folder structure (dist/index.html, dist/tools/..., dist/legal/...).
  5. Copies css/, js/, assets/, robots.txt, sitemap.xml, _headers into /dist.

Why: Cloudflare Pages has no build step configured, so the deployed output
must be plain HTML with no server-side includes. This script gives you a
single source of truth for the header/footer (includes/header.html and
includes/footer.html) while still shipping flat static files.

Usage:
    python3 build.py
    # then deploy the generated /dist folder to Cloudflare Pages
    # (or point your Pages project's output directory at /dist)

Placeholders expected in each page source:
    <!-- @@HEADER@@ -->
    <!-- @@FOOTER@@ -->
"""

import shutil
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
DIST = ROOT / "dist"
INCLUDES = ROOT / "includes"

SKIP_DIRS = {"includes", "dist", ".git", "__pycache__"}
STATIC_COPY_ITEMS = ["css", "js", "assets", "robots.txt", "sitemap.xml", "_headers", "404.html"]

HEADER_PLACEHOLDER = "<!-- @@HEADER@@ -->"
FOOTER_PLACEHOLDER = "<!-- @@FOOTER@@ -->"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def stitch_page(html: str, header_html: str, footer_html: str) -> str:
    if HEADER_PLACEHOLDER not in html or FOOTER_PLACEHOLDER not in html:
        raise ValueError("Missing @@HEADER@@ or @@FOOTER@@ placeholder")
    html = html.replace(HEADER_PLACEHOLDER, header_html)
    html = html.replace(FOOTER_PLACEHOLDER, footer_html)
    return html


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    header_html = read(INCLUDES / "header.html")
    footer_html = read(INCLUDES / "footer.html")

    built = 0
    for html_file in ROOT.rglob("*.html"):
        rel = html_file.relative_to(ROOT)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if rel.name == "404.html":
            continue  # copied verbatim below (no header/footer on error page, by design)

        out_path = DIST / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)

        source = read(html_file)
        stitched = stitch_page(source, header_html, footer_html)
        out_path.write_text(stitched, encoding="utf-8")
        built += 1
        print(f"  built  {rel}")

    # Copy static assets & root files verbatim
    for item in STATIC_COPY_ITEMS:
        src = ROOT / item
        if not src.exists():
            continue
        dst = DIST / item
        if src.is_dir():
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)

    print(f"\nDone. {built} page(s) stitched into /dist. Deploy the /dist folder.")


if __name__ == "__main__":
    main()
