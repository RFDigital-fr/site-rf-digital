/* RF Digital — thème, menu mobile, chargement différé du logo 3D. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---------- Thème soleil / lune ---------- */
  var KEY = 'rf-theme';
  var toggle = document.querySelector('.theme-toggle');
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; }
  }
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggle) {
      var dark = theme === 'dark';
      toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      toggle.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
    }
  }
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) { /* stockage indisponible */ }
      setTheme(next);
    });
  }
  /* Tant que le visiteur n'a rien choisi, on suit le réglage du navigateur. */
  if (media) {
    var follow = function (e) { if (!stored()) setTheme(e.matches ? 'dark' : 'light'); };
    if (media.addEventListener) media.addEventListener('change', follow);
    else if (media.addListener) media.addListener(follow);
  }

  /* ---------- Menu mobile ---------- */
  var menuBtn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu');
  function closeMenu(focusBtn) {
    if (!menuBtn || menuBtn.getAttribute('aria-expanded') !== 'true') return;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Ouvrir le menu');
    root.classList.remove('menu-open');
    if (focusBtn) menuBtn.focus();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      menuBtn.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
      root.classList.toggle('menu-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') closeMenu(true);
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) closeMenu(false); });
  }

  /* ---------- Logo 3D : chargé à l'approche du bloc, seulement si les conditions sont réunies ---------- */
  var block = document.getElementById('logo-3d');
  function webglOk() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }
  function conditions() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return window.innerWidth >= 768 && !reduce && webglOk();
  }
  if (block && 'IntersectionObserver' in window && 'ResizeObserver' in window && conditions()) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var s = document.createElement('script');
      s.src = '/assets/js/logo-3d.min.js';
      s.async = true;
      document.body.appendChild(s);
    }, { rootMargin: '600px 0px' });
    io.observe(block);
  }
})();
