/* Démos RF Digital — démo 2 : préparation de la photo dans le navigateur, avant l'envoi.
   Contrôle le format (JPG, PNG, HEIC) et la taille (5 Mo), puis redimensionne (1 024 px au plus sur le
   grand côté) et convertit en JPEG. Effets : envoi léger, coût de l'IA réduit, métadonnées de la photo
   (position GPS, appareil…) retirées par la conversion. Rien n'est stocké : tout reste en mémoire.
   Expose window.RFDPhotoAnnonce.preparer(fichier) → Promise<{ base64, url }> ou rejet { code }. */
(function () {
  'use strict';

  var TAILLE_MAX = 5 * 1024 * 1024;
  var COTE_MAX = 1024;
  var QUALITE = 0.82;
  var TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  var EXTENSIONS = /\.(jpe?g|png|heic|heif)$/i;

  function erreur(code) { var e = new Error(code); e.code = code; return e; }

  function charger(fichier) {
    return new Promise(function (ok, ko) {
      var url = URL.createObjectURL(fichier);
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { ok({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); ko(erreur('illisible')); };
      img.src = url;
    });
  }

  function preparer(fichier) {
    if (!fichier) return Promise.reject(erreur('format'));
    var type = (fichier.type || '').toLowerCase();
    var heic = /hei[cf]/.test(type) || /\.hei[cf]$/i.test(fichier.name || '');
    if (TYPES.indexOf(type) < 0 && !EXTENSIONS.test(fichier.name || '')) return Promise.reject(erreur('format'));
    if (fichier.size > TAILLE_MAX) return Promise.reject(erreur('taille'));

    return charger(fichier).then(function (r) {
      var l = r.img.naturalWidth, h = r.img.naturalHeight;
      URL.revokeObjectURL(r.url);
      if (!l || !h) throw erreur(heic ? 'heic' : 'illisible');
      var k = Math.min(1, COTE_MAX / Math.max(l, h));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(l * k));
      canvas.height = Math.max(1, Math.round(h * k));
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; // fond blanc pour les PNG transparents
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(r.img, 0, 0, canvas.width, canvas.height);
      return new Promise(function (ok, ko) {
        canvas.toBlob(function (blob) {
          if (!blob) return ko(erreur('illisible'));
          var lecteur = new FileReader();
          lecteur.onload = function () {
            var base64 = String(lecteur.result).split(',')[1] || '';
            ok({ base64: base64, url: URL.createObjectURL(blob) });
          };
          lecteur.onerror = function () { ko(erreur('illisible')); };
          lecteur.readAsDataURL(blob);
        }, 'image/jpeg', QUALITE);
      });
    }, function (e) {
      // Format accepté mais que ce navigateur ne sait pas lire (HEIC hors Safari, le plus souvent).
      throw erreur(heic ? 'heic' : e.code || 'illisible');
    });
  }

  window.RFDPhotoAnnonce = { preparer: preparer, TAILLE_MAX: TAILLE_MAX, COTE_MAX: COTE_MAX };
})();
