# BitsServer IT Lab — Static Site (Modular Refactor)

Pure static HTML/CSS/JS for Cloudflare Pages. **No build step, no Python,
no framework** — the browser assembles each page at request time.

## File structure

```
index.html              Homepage — includes header/footer via data-include
includes/
  header.html             Single source of truth for site nav
  footer.html             Single source of truth for footer + addresses
tools/
  index.html               Free Tools hub / listing page
  _template.html            Copy this to create a new coming-soon tool page
legal/                    (move your existing legal .html files here)
about.html / contact.html  (apply the same data-include pattern — see below)
css/style.css
js/
  include.js               Fetches header.html/footer.html into the page,
                             then loads the rest of your scripts in order
  main.js, hero-scene.js
assets/
```

## How the modular header/footer works

Every page has two placeholder divs and one script tag instead of the old
inline header/footer markup and bottom `<script>` tags:

```html
<div data-include="/includes/header.html"></div>
...
<div data-include="/includes/footer.html"></div>

<script src="/js/include.js"
        data-then="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js,/js/hero-scene.js,/js/main.js">
</script>
```

At page load, `js/include.js`:
1. Fetches `includes/header.html` and `includes/footer.html` and swaps them
   into the two placeholder divs.
2. Sets the `#current-year` footer text automatically.
3. Only THEN loads the scripts listed in `data-then` (comma-separated, in
   order) — so `main.js` never runs before the nav/footer it depends on
   actually exist in the DOM.

For pages that don't need the 3D hero (about, contact, legal, tools), just
list fewer scripts: `data-then="/js/main.js"`.

**To change the nav or footer sitewide:** edit `includes/header.html` or
`includes/footer.html` once — every page picks it up automatically, no
rebuild, no redeploy step beyond your normal push.

### Trade-off worth knowing
The previous header used a pure-CSS checkbox menu specifically so it kept
working with JavaScript disabled. Because the header is now fetched by
`include.js`, a page with JS disabled or blocked will show **no header or
footer** rather than a working-but-unstyled one. If that resilience matters
more to you than having a single shared file, the alternative is duplicating
the header/footer markup in every page by hand — which was requirement #1
you asked to move away from. Flag it if you'd rather I add a `<noscript>`
fallback with a minimal inline nav.

## Coming-soon tools

All tool pages live under `/tools/`. Add a new one:
1. Copy `tools/_template.html` → `tools/your-tool-slug.html`
2. Replace the `TOOL NAME` / `TOOL-SLUG` placeholders
3. Add a card for it in `tools/index.html`
4. Link to it from the homepage teaser if you want it featured

## Office locations

Both offices now appear in `includes/footer.html`, the homepage contact
section, and the JSON-LD Organization schema in `index.html`:
- **Headquarters:** Multan, Pakistan
- **Zonal Office:** Abu Dhabi, UAE

## Social links

Every social icon link now uses `target="_blank" rel="noopener noreferrer"`.

## CSS note

`includes/footer.html` adds a `.footer-address-list` element for the two
office locations. It inherits the existing footer `<ul>` styling by default;
add this to `css/style.css` for tighter spacing if you like:

```css
.footer-address-list { list-style: none; padding: 0; margin: 10px 0 16px; }
.footer-address-list li { margin-bottom: 6px; font-size: 14px; opacity: .85; }
```

## Still needed from you

I only have the actual current content of `index.html` and `about.html`
from your repo (fetched via GitHub's web view — no raw/API access from
here). `contact.html` and the legal pages exist in your repo but I haven't
seen their content, so I couldn't convert them in this pass. Upload them
(or the whole repo as a zip) and I'll apply the same `data-include` swap,
address updates, and `target="_blank"` fix to those too.
