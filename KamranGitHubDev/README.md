# BitsServer IT Lab — Static Site (Modular Refactor)

Static site for Cloudflare Pages. No framework, no runtime build step —
`build.py` is a **local dev-time script** you run before every deploy.

## File structure

```
index.html            Homepage (source, contains include placeholders)
includes/
  header.html          Single source of truth for site nav
  footer.html           Single source of truth for footer + addresses
tools/
  index.html            Free Tools hub / listing page
  _template.html         Copy this to create a new coming-soon tool page
legal/                  (add your existing legal .html files here)
about.html / contact.html   (apply the same @@HEADER@@/@@FOOTER@@ pattern)
css/style.css
js/main.js, js/hero-scene.js
assets/
build.py                Stitches header/footer into every page -> /dist
```

## How the modular header/footer works

Every page source contains two placeholder comments:

```html
<!-- @@HEADER@@ -->
...
<!-- @@FOOTER@@ -->
```

Running `python3 build.py`:
1. Reads `includes/header.html` and `includes/footer.html`
2. Replaces the placeholders in every `*.html` file (except `includes/` and `dist/`)
3. Writes plain, flattened static HTML into `/dist`
4. Copies `css/`, `js/`, `assets/`, `robots.txt`, `sitemap.xml`, `_headers`, `404.html` into `/dist`

**Deploy the generated `/dist` folder** to Cloudflare Pages — it's 100% static
HTML, so nothing changes about your "no build step" hosting setup; the build
step just runs on your machine (or in CI) before you push/upload.

To change the nav or footer sitewide: edit `includes/header.html` /
`includes/footer.html` once, run `python3 build.py`, redeploy `/dist`.

## Coming-soon tools

All tool pages live under `/tools/`. Add a new one:
1. Copy `tools/_template.html` to `tools/your-tool-slug.html`
2. Replace `TOOL NAME` / `TOOL-SLUG` placeholders
3. Add a card for it in `tools/index.html`
4. Link to it from the homepage teaser if desired

## Office locations

Both locations now appear in `includes/footer.html`, the homepage contact
section, and the JSON-LD Organization schema in `index.html`:
- **Headquarters:** Multan, Pakistan
- **Zonal Office:** Abu Dhabi, UAE

## Social links

All social icons in `includes/footer.html` and `index.html`'s contact
section now use `target="_blank" rel="noopener noreferrer"`.

## CSS note

`includes/footer.html` adds a `.footer-address-list` element for the two
office locations. It inherits existing footer `<ul>` styling out of the box;
add this small rule to `css/style.css` if you want tighter control:

```css
.footer-address-list { list-style: none; padding: 0; margin: 10px 0 16px; }
.footer-address-list li { margin-bottom: 6px; font-size: 14px; opacity: .85; }
```
