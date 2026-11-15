/* RF Digital — compteur de visites maison (aucun cookie, aucun stockage, aucun service tiers).
   Un seul envoi par page réellement chargée, vers la fonction Supabase « compteur-visites » du site.
   Transmis : la page, la catégorie de provenance, le paramètre « src », ordinateur ou mobile. Rien d'autre :
   ni adresse de page complète, ni référent, ni identifiant. Détails : mentions légales, « Cookies et traceurs ». */
(function () {
  var ADRESSE = 'https://nbwlhdyeektezpvhjaih.supabase.co/functions/v1/compteur-visites';

  try {
    if (navigator.webdriver) return; // navigateur piloté par un programme

    var script = document.currentScript;
    var page = script && script.getAttribute('data-page');
    if (page !== 'accueil' && page !== 'mentions' && page !== '404') return;

    // Provenance : seule la catégorie est envoyée, jamais l'adresse d'origine.
    var provenance = 'direct';
    var ref = document.referrer || '';
    if (ref) {
      var hote = '';
      var m = /^[a-z][a-z0-9+.-]*:\/\/([^\/?#:]+)/i.exec(ref);
      if (m) hote = m[1].toLowerCase();
      if (hote === location.hostname) provenance = 'interne';
      else if (/(^|\.)google\.[a-z.]+$/.test(hote) || hote.indexOf('com.google.') === 0) provenance = 'google';
      else if (/(^|\.)linkedin\.com$/.test(hote) || hote === 'lnkd.in' || hote === 'com.linkedin.android') provenance = 'linkedin';
      else if (hote) provenance = 'autres-sites';
    }

    // Lien marqué ?src=… : valeur courte ; la fonction range toute valeur inconnue dans « autre ».
    var src = '';
    var brut = /[?&]src=([^&#]*)/.exec(location.search);
    if (brut) {
      try { src = decodeURIComponent(brut[1].replace(/\+/g, ' ')); } catch (e) { src = 'autre'; }
      src = src.trim().toLowerCase();
      if (src !== '' && !/^[a-z0-9-]{1,20}$/.test(src)) src = 'autre';
    }

    // Appareil : les tablettes sont comptées comme « mobile ».
    var ua = navigator.userAgent || '';
    var mobile = /Mobi|Android|iPhone|iPad|iPod|Tablet|Silk|Kindle/i.test(ua) ||
      (navigator.userAgentData && navigator.userAgentData.mobile === true) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPad en mode « ordinateur »

    var corps = JSON.stringify({ p: page, o: provenance, s: src, a: mobile ? 'mobile' : 'ordinateur' });

    var envoyer = function () {
      try {
        if (navigator.sendBeacon && navigator.sendBeacon(ADRESSE, corps)) return;
        if (window.fetch) {
          fetch(ADRESSE, { method: 'POST', body: corps, mode: 'no-cors', credentials: 'omit', keepalive: true })
            .catch(function () { /* silencieux */ });
        }
      } catch (e) { /* silencieux */ }
    };

    // Page préchargée par le navigateur : envoi seulement si elle est réellement affichée.
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', envoyer, { once: true });
    } else {
      envoyer();
    }
  } catch (e) { /* le compteur ne doit jamais gêner la page */ }
})();
