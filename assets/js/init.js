/* RF Digital — réglages lus avant l'affichage de chaque page (index, mentions légales, 404). */
(function () {
  /* ==========================================================
     RÉGLAGE DES DÉMOS — UNIQUE, VALABLE POUR TOUTES LES PAGES
     false = section « Démos » et lien du menu masqués
     true  = section et lien affichés
     ========================================================== */
  var DEMOS = false;

  var root = document.documentElement;
  root.setAttribute('data-demos', DEMOS ? 'on' : 'off');

  /* Thème : choix mémorisé (stockage local, clé rf-theme, aucun cookie), sinon réglage du navigateur. */
  var theme = null;
  try { theme = localStorage.getItem('rf-theme'); } catch (e) { /* stockage indisponible */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);
})();
