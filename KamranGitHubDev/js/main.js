/* ============================================================================
   BitsServer IT Lab — site interactivity.
   Everything here is progressive enhancement: if this script fails entirely,
   the page is still complete — all text visible, mobile menu works via the
   pure-CSS checkbox toggle already in the HTML/CSS, all links work.
   ============================================================================ */
document.addEventListener('DOMContentLoaded', function () {

  // ---- Scroll progress bar + header shrink + back-to-top visibility ----
  try {
    var progressBar = document.getElementById('scroll-progress');
    var header = document.getElementById('site-header');
    var backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', function () {
      try {
        var h = document.documentElement;
        var scrolled = h.scrollTop || document.body.scrollTop;
        var height = h.scrollHeight - h.clientHeight;
        if (progressBar) progressBar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
        if (header) { if (window.scrollY > 40) header.classList.add('scrolled'); else header.classList.remove('scrolled'); }
        if (backToTop) { if (window.scrollY > 500) backToTop.classList.add('show'); else backToTop.classList.remove('show'); }
      } catch (err) {}
    }, { passive: true });
    if (backToTop) backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  } catch (err) {}

  // ---- Cursor glow (desktop only, CSS already hides it under 900px) ----
  try {
    var cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('mousemove', function (e) {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
      });
    }
  } catch (err) {}

  // ---- Close mobile menu when a link is tapped ----
  try {
    var navCheck = document.getElementById('nav-check');
    document.querySelectorAll('#main-nav a').forEach(function (link) {
      link.addEventListener('click', function () { if (navCheck) navCheck.checked = false; });
    });
  } catch (err) {}

  // ---- Highlight active nav link on scroll ----
  try {
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('#main-nav a[href^="#"]'));
    if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove('active'); });
            var match = navLinks.filter(function (l) { return l.getAttribute('href') === '#' + entry.target.id; })[0];
            if (match) match.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { observer.observe(s); });
    }
  } catch (err) {}

  // ---- Reveal-on-scroll for elements with .reveal (adds .anim treatment) ----
  try {
    var revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('anim');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('anim', 'no-js'); });
    }
  } catch (err) {}

  // ---- Stat counters: HTML already shows the final number as a fallback ----
  try {
    var statsAnimated = false;
    function animateStats() {
      try {
        if (statsAnimated) return;
        var statsSection = document.getElementById('stats');
        if (!statsSection) return;
        var rect = statsSection.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;
        statsAnimated = true;
        document.querySelectorAll('.stat-num').forEach(function (el) {
          var target = parseInt(el.getAttribute('data-target'), 10) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          var current = 0;
          var duration = 1400;
          var stepTime = Math.max(Math.floor(duration / Math.max(target, 1)), 10);
          var timer = setInterval(function () {
            current += Math.ceil(target / (duration / stepTime));
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = current + suffix;
          }, stepTime);
        });
      } catch (err) {}
    }
    window.addEventListener('scroll', animateStats, { passive: true });
    animateStats();
  } catch (err) {}

  // ---- Contact form: client-side handling (see form's data-endpoint note in HTML) ----
  try {
    var form = document.getElementById('contact-form');
    var formStatus = document.getElementById('form-status');
    if (form) {
      form.addEventListener('submit', function (e) {
        var endpoint = form.getAttribute('action');
        var isPlaceholder = !endpoint || endpoint.indexOf('REPLACE_WITH') !== -1;
        if (isPlaceholder) {
          e.preventDefault();
          if (formStatus) {
            formStatus.textContent = 'Form endpoint not connected yet — see the note in the page source for setup steps.';
            formStatus.style.color = '#ff8a8a';
          }
        }
        // If a real endpoint is configured, the form submits normally (e.g. to
        // Cloudflare Pages Forms, Formspree, or a Worker — see HTML comment).
      });
    }
  } catch (err) {}

  // ---- Footer year ----
  try {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch (err) {}

});
