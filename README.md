# BitsServer IT Lab — Static Site

A static site (no build step, no framework) for **Cloudflare Pages**.

## File structure
```
index.html          Main landing page
404.html            Not-found page
robots.txt / sitemap.xml
_headers             Cloudflare Pages security/caching headers
css/style.css        All styles
js/hero-scene.js     Real WebGL 3D hero scene (Three.js)
js/main.js           Scroll effects, nav, counters, form handling
assets/favicon.svg
```

## Deploy to Cloudflare Pages
**Option A — drag and drop (fastest):**
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Drag this entire folder in. Done — you get a `*.pages.dev` URL immediately.

**Option B — Git (recommended for ongoing edits):**
1. Push this folder to a GitHub/GitLab repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build settings: **no build command**, output directory = `/` (root).
4. Every push to your main branch auto-deploys.

**Custom domain:** Pages project → Custom domains → add `bitsserver.com` / `www.bitsserver.com` and follow the DNS prompts (if your domain is already on Cloudflare, this is a couple of clicks).

## Things to connect after deploy

1. **Contact form** (`index.html`, `#contact-form`) — Cloudflare Pages doesn't
   process form submissions itself. Pick one:
   - **Formspree / Web3Forms** (no code): create a free endpoint, paste it
     into the form's `action="..."` attribute.
   - **Cloudflare Pages Function** (stays on your domain): add
     `/functions/api/contact.js` that reads the POST body and sends it via
     an email API, then set `action="/api/contact"`.
   Until then, the form shows a friendly "not connected yet" message instead
   of silently failing (see `js/main.js`).

2. **Legal pages** — the footer links to `/privacy-policy.html`,
   `/terms-and-conditions.html`, etc. Add these as plain `.html` files at the
   site root (copy `404.html`'s `<head>`/header/footer as a starting
   template) once you have real content for them.

3. **OG image** — `index.html` references `/assets/og-image.jpg` for social
   link previews; add a 1200×630 image at that path.

4. **Domain references** — canonical URL, sitemap, and JSON-LD all assume
   `https://www.bitsserver.com`. Update if the final domain differs.

## Notes on resilience
- The mobile menu is pure CSS (checkbox toggle) — works even if all
  JavaScript fails.
- The hero's WebGL scene fails silently if Three.js can't load (offline,
  ad-blocker, old browser) — the ambient CSS gradient background behind it
  still makes the hero look complete.
- `prefers-reduced-motion` is respected: the 3D scene renders one static
  frame instead of animating, and CSS entrance animations are skipped.
