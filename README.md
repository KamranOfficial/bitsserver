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

## ⚠️ Caching gotcha with `/css/*` and `/js/*`

`_headers` sets `Cache-Control: public, max-age=604800, immutable` on
`/css/*` and `/js/*` — a 7-day cache that browsers **never revalidate**,
even on a hard refresh. Great for performance, but it means any future
edit to `style.css` or `main.js` won't be visible to returning visitors
(or even you, testing in the same browser) until that cache expires or you
force a fresh copy.

**Fix going forward:** bump the `?v=` query string on `style.css` and
`main.js` (and `hero-scene.js` if you touch it) every time you change them —
already done for this update (`?v=20260809`). A different-looking URL is a
different cache entry, so the browser fetches it fresh regardless of the
`immutable` header. `includes/header.html` and `includes/footer.html`
aren't affected — they're fetched at runtime by `include.js` and aren't
covered by the `/css/*` / `/js/*` rule, so those update immediately on
every deploy without any versioning needed.



A theme system now lives across the same shared files:

- **`css/style.css`** — all design-system colors are CSS custom properties
  (`--c-primary`, `--c-bg`, `--glass-bg`, etc.), plus a few new ones for
  surfaces that were previously hardcoded (`--header-bg`, `--grid-line`,
  `--glow-1/2/3`, `--input-bg`, `--card-shadow`...). Dark values live on
  `:root` (unchanged from the original design). Light values apply two ways:
  `@media (prefers-color-scheme: light)` for system detection, and
  `[data-theme="light"]` / `[data-theme="dark"]` for a manual override —
  the explicit attribute rules are written *after* the media query in the
  file so they always win on a tie, letting a manual choice override the
  system preference.
- **`js/main.js`** — reads/writes `localStorage["bitsserver-theme"]`
  (`"system"`, `"light"`, or `"dark"`). `"system"` means no `data-theme`
  attribute is set, so the CSS media query above decides. Listens for OS
  theme changes live while in `"system"` mode. Every localStorage call is
  wrapped in try/catch, so the theme system degrades gracefully (falls back
  to system/CSS-only behavior) if storage is blocked or unavailable.
- **`includes/header.html`** — compact sun/moon toggle button
  (`[data-theme-toggle]`) that cycles System → Light → Dark → System.
- **`includes/footer.html`** — explicit System / Light / Dark buttons
  (`[data-theme-option]`) so users can always get back to "follow my OS"
  after picking one manually.
- **Anti-flash inline script**: a ~150-byte inline `<script>` was added to
  the `<head>` of `index.html`, `404.html`, `tools/index.html`, and
  `tools/_template.html` (before anything else loads) that reads the saved
  preference and sets `data-theme` before first paint. This was necessary
  because `main.js` itself only runs after `include.js` finishes fetching
  the header/footer over the network — too late to prevent a flash on its
  own. **Any new page copied from `tools/_template.html` already includes
  this snippet; keep it if you hand-roll a new page.**
- **No JS? No problem.** With JavaScript disabled, there's no toggle, but
  the site still follows the OS-level `prefers-color-scheme` automatically
  via CSS alone.

## Bug fix: `main.js` events were silently not running

While wiring up the theme toggle I found that **`main.js`'s entire body was
never executing** in production. It's loaded dynamically by `include.js`
*after* `DOMContentLoaded` has already fired (since header.html/footer.html
are fetched async first) — but the file wrapped everything in
`document.addEventListener('DOMContentLoaded', ...)`, which registers for an
event that had already fired and will never fire again. I verified this with
a headless-browser test: the scroll progress bar, header shrink-on-scroll,
mobile-menu auto-close-on-link-tap, active-nav-link highlighting, and stat
counters were all inert. Fixed with a small `readyState`-aware `bsReady()`
helper at the top of `main.js` that runs immediately if the document is
already past the loading phase, or behaves like the old listener otherwise.
Re-tested after the fix — all of the above now work as intended.



I only have the actual current content of `index.html` and `about.html`
from your repo (fetched via GitHub's web view — no raw/API access from
here). `contact.html` and the legal pages exist in your repo but I haven't
seen their content, so I couldn't convert them in this pass. Upload them
(or the whole repo as a zip) and I'll apply the same `data-include` swap,
address updates, and `target="_blank"` fix to those too.
