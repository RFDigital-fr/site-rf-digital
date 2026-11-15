/* Démos RF Digital — démo 1 « Relance de factures ».
   Le visiteur saisit son adresse, coche l'accord, et reçoit 3 mails espacés de 2 minutes.
   Aucun cookie, aucun stockage, aucun service tiers : seul l'appel à la fonction serveur RF Digital.
   Réglage : attribut data-endpoint du bloc [data-rfd-relance] (adresse de la fonction serveur).
   data-endpoint="simulation" : faux serveur local, pour tester l'affichage sans rien envoyer. */
(function () {
  'use strict';

  var script = document.currentScript;
  var URL_WORKER = script && script.src ? script.src.replace(/[^/]*$/, 'anti-robot-worker.js') : 'anti-robot-worker.js';
  var ECART_MS = 2 * 60 * 1000;

  var MESSAGES = {
    accord: 'Cochez la case pour accepter de recevoir les 3 mails de démonstration.',
    adresse: 'Cette adresse ne semble pas pouvoir recevoir de mails. Vérifiez-la.',
    deja: 'Cette adresse a déjà reçu la démonstration.',
    limite_visiteur: 'Vous avez atteint la limite de démonstrations pour aujourd’hui. Réessayez demain.',
    quota_jour: 'La démo a beaucoup servi aujourd’hui. Revenez demain !',
    robot: 'La vérification automatique a échoué. Rechargez la page et réessayez.',
    technique: 'Un souci technique empêche l’envoi. Réessayez dans quelques minutes.'
  };

  function initialiser(bloc) {
    var endpoint = (bloc.getAttribute('data-endpoint') || '').replace(/\/+$/, '');
    var form = bloc.querySelector('form');
    var champ = form.querySelector('input[type="email"]');
    var accord = form.querySelector('input[type="checkbox"]');
    var piege = form.querySelector('.rfd-piege input');
    var bouton = form.querySelector('button[type="submit"]');
    var message = form.querySelector('.rfd-message');
    var suivi = bloc.querySelector('.rfd-suivi');
    var frise = bloc.querySelector('.rfd-frise');
    var affiche = Date.now();
    var calcul = null; // promesse { defi, nombre, recu }
    var enCours = false;

    function afficherMessage(texte, erreur) {
      message.textContent = texte || '';
      message.classList.toggle('rfd-erreur', !!erreur);
    }

    // ----- Anti-robot : démarre dès que le visiteur touche le formulaire -----
    function preparer() {
      if (calcul && Date.now() - calcul.recu < 8 * 60 * 1000) return calcul.promesse;
      var recu = Date.now();
      var promesse = obtenirDefi().then(function (defi) {
        return resoudre(defi).then(function (nombre) {
          return { sel: defi.sel, defi: defi.defi, max: defi.max, expire: defi.expire, signature: defi.signature, nombre: nombre };
        });
      });
      promesse.catch(function () { calcul = null; });
      calcul = { promesse: promesse, recu: recu };
      return promesse;
    }

    function obtenirDefi() {
      if (endpoint === 'simulation') {
        return Promise.resolve({ sel: 'simulation', defi: '', max: 0, expire: 0, signature: '' });
      }
      return fetch(endpoint + '/defi', { method: 'GET', credentials: 'omit', cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('defi'); return r.json(); });
    }

    function resoudre(defi) {
      if (endpoint === 'simulation') return new Promise(function (ok) { setTimeout(function () { ok(0); }, 600); });
      return new Promise(function (ok, ko) {
        var w;
        try { w = new Worker(URL_WORKER); } catch (e) { w = null; }
        if (!w) return resoudreIci(defi).then(ok, ko);
        w.onmessage = function (e) { w.terminate(); if (e.data && typeof e.data.nombre === 'number') ok(e.data.nombre); else ko(new Error('calcul')); };
        w.onerror = function () { w.terminate(); resoudreIci(defi).then(ok, ko); };
        w.postMessage({ sel: defi.sel, defi: defi.defi, max: defi.max });
      });
    }

    // Secours si le navigateur refuse le « worker » (même calcul, dans la page).
    function resoudreIci(defi) {
      var enc = new TextEncoder();
      var n = 0;
      function lot() {
        var p = [];
        var debut = n;
        for (var i = 0; i < 256 && n <= defi.max; i++, n++) p.push(crypto.subtle.digest('SHA-256', enc.encode(defi.sel + n)));
        return Promise.all(p).then(function (res) {
          for (var k = 0; k < res.length; k++) {
            var h = Array.prototype.map.call(new Uint8Array(res[k]), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
            if (h === defi.defi) return debut + k;
          }
          if (n > defi.max) throw new Error('introuvable');
          return lot();
        });
      }
      return lot();
    }

    form.addEventListener('focusin', preparer, { once: true });
    form.addEventListener('pointerdown', preparer, { once: true });

    // ----- Envoi -----
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (enCours) return;
      afficherMessage('');
      champ.removeAttribute('aria-invalid');

      var email = champ.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        champ.setAttribute('aria-invalid', 'true');
        afficherMessage('Indiquez une adresse e-mail valide, par exemple prenom@entreprise.fr.', true);
        champ.focus();
        return;
      }
      if (!accord.checked) {
        afficherMessage(MESSAGES.accord, true);
        accord.focus();
        return;
      }

      enCours = true;
      bouton.disabled = true;
      bouton.textContent = 'Envoi en cours…';

      preparer()
        .then(function (solution) {
          var corps = {
            email: email,
            accord: true,
            piege: piege ? piege.value : '',
            duree_saisie: Date.now() - affiche,
            solution: solution
          };
          if (endpoint === 'simulation') return simuler(email);
          return fetch(endpoint + '/lancer', {
            method: 'POST',
            credentials: 'omit',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(corps)
          }).then(function (r) { return r.json().catch(function () { return { ok: false, code: 'technique' }; }); });
        })
        .catch(function () { return { ok: false, code: 'technique' }; })
        .then(function (rep) {
          enCours = false;
          bouton.disabled = false;
          bouton.textContent = 'Lancer la démo';
          calcul = null; // un défi ne sert qu'une fois
          if (rep && rep.ok) return reussite();
          afficherMessage(MESSAGES[rep && rep.code] || MESSAGES.technique, true);
        });
    });

    function simuler(email) {
      return new Promise(function (ok) {
        setTimeout(function () {
          var m = /^(deja|limite_visiteur|quota_jour|adresse|technique)@/.exec(email);
          ok(m ? { ok: false, code: m[1] } : { ok: true });
        }, 500);
      });
    }

    // ----- Suivi des 3 mails (affichage seul, calculé dans le navigateur) -----
    function reussite() {
      form.hidden = true;
      suivi.hidden = false;
      var depart = Date.now();
      var lignes = frise.querySelectorAll('li');
      var etats = [];
      for (var i = 0; i < lignes.length; i++) {
        var e = lignes[i].querySelector('.rfd-etat');
        if (!e) { e = document.createElement('span'); e.className = 'rfd-etat'; lignes[i].appendChild(e); }
        etats.push(e);
      }
      function maj() {
        var t = Date.now() - depart;
        var fini = true;
        for (var i = 0; i < etats.length; i++) {
          var reste = i * ECART_MS - t;
          if (reste <= 0) {
            etats[i].textContent = 'Envoyé';
            lignes[i].classList.add('rfd-fait');
          } else {
            fini = false;
            var s = Math.ceil(reste / 1000);
            etats[i].textContent = 'Envoi dans ' + Math.floor(s / 60) + ' min ' + ('0' + (s % 60)).slice(-2) + ' s';
          }
        }
        if (!fini) setTimeout(maj, 1000);
      }
      maj();
      var titre = suivi.querySelector('.rfd-suivi-titre');
      if (titre) { titre.setAttribute('tabindex', '-1'); titre.focus(); }
    }
  }

  function demarrer() {
    var blocs = document.querySelectorAll('[data-rfd-relance]');
    for (var i = 0; i < blocs.length; i++) initialiser(blocs[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
