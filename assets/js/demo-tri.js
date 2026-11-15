/* Démos RF Digital — démo 3 « Tri de mails » (animation, aucun vrai mail).
   Le visiteur choisit un scénario ; dans tous les cas : pubs écartées, urgents en haut,
   puis regroupement selon le scénario. Animation par transform/opacity (fluide sur iPhone).
   « Réduire les animations » : aucun déplacement, le tri s'applique d'un coup avec un court fondu.
   Données : demo-tri-donnees.js (à charger avant ce fichier). */
(function () {
  'use strict';

  var reduit = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var DUREE = 420;
  var COURBE = 'cubic-bezier(.2, .7, .2, 1)';

  var SCENARIOS = {
    opportunites: {
      groupes: [
        { titre: 'Opportunités · demandes de devis', filtre: function (m) { return m.cat === 'opp' && m.sous === 'devis'; } },
        { titre: 'Opportunités · offres commerciales', filtre: function (m) { return m.cat === 'opp' && m.sous === 'offre'; } }
      ],
      etiquette: function (m) { return m.cat === 'opp' ? (m.sous === 'devis' ? 'Devis' : 'Offre commerciale') : null; },
      resume: function (n) { return n.opp + ' opportunités regroupées (' + n.devis + ' devis, ' + n.offre + ' offres commerciales)'; }
    },
    fournisseurs: {
      groupes: [
        { titre: 'Factures fournisseurs · par échéance', filtre: function (m) { return m.cat === 'fou'; }, tri: function (a, b) { return a.echeance - b.echeance; } }
      ],
      etiquette: function (m) {
        if (m.cat !== 'fou') return null;
        return m.echeance < 0 ? 'Échue' : 'Échéance dans ' + m.echeance + ' j';
      },
      resume: function (n) { return n.fou + ' factures fournisseurs classées par échéance'; }
    },
    clients: {
      groupes: [
        { titre: 'Suivi clients · réponses reçues', filtre: function (m) { return m.cat === 'cli' && m.sous === 'reponse'; } },
        { titre: 'Suivi clients · relances envoyées', filtre: function (m) { return m.cat === 'cli' && m.sous === 'relance'; } }
      ],
      etiquette: function (m) { return m.cat === 'cli' ? (m.sous === 'reponse' ? 'Réponse reçue' : 'Relance envoyée') : null; },
      resume: function (n) { return n.reponse + ' réponses reçues et ' + n.relance + ' relances envoyées regroupées'; }
    }
  };

  function attendre(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

  function creerMail(m) {
    var el = document.createElement('div');
    el.className = 'rfd-mail';
    el.setAttribute('data-cle', 'm' + m.id);
    el.innerHTML =
      '<span class="rfd-avatar" aria-hidden="true"></span>' +
      '<div class="rfd-mail-corps">' +
      '<div class="rfd-l1"><span class="rfd-de"></span><span class="rfd-heure"></span></div>' +
      '<div class="rfd-objet"></div><div class="rfd-apercu"></div><div class="rfd-etiquettes"></div></div>';
    el.querySelector('.rfd-avatar').textContent = m.ini;
    el.querySelector('.rfd-de').textContent = m.de;
    el.querySelector('.rfd-heure').textContent = m.heure;
    el.querySelector('.rfd-objet').textContent = m.objet;
    el.querySelector('.rfd-apercu').textContent = m.apercu;
    return el;
  }

  function initialiser(bloc) {
    var mails = window.RFD_TRI_MAILS || [];
    var liste = bloc.querySelector('.rfd-liste');
    var ecartes = bloc.querySelector('.rfd-ecartes');
    var ecartesBtn = ecartes.querySelector('button');
    var ecartesListe = ecartes.querySelector('.rfd-ecartes-liste');
    var compte = bloc.querySelector('.rfd-compte');
    var resume = bloc.querySelector('.rfd-resume');
    var reinit = bloc.querySelector('.rfd-reinit');
    var boutons = bloc.querySelectorAll('[data-scenario]');
    var els = {};
    var groupes = {};
    var jeton = 0;
    var dejaTrie = false;

    mails.forEach(function (m) { els[m.id] = creerMail(m); });
    var pubs = mails.filter(function (m) { return m.cat === 'pub'; });
    var gardes = mails.filter(function (m) { return m.cat !== 'pub'; });
    var urgents = gardes.filter(function (m) { return m.urgent; });

    function groupe(cle, titre) {
      if (!groupes[cle]) {
        var g = document.createElement('div');
        g.className = 'rfd-groupe';
        g.setAttribute('data-cle', 'g-' + cle);
        g.textContent = titre;
        groupes[cle] = g;
      }
      return groupes[cle];
    }

    function etiquette(m, texte, classe) {
      var s = document.createElement('span');
      s.textContent = texte;
      if (classe) s.className = classe;
      els[m.id].querySelector('.rfd-etiquettes').appendChild(s);
    }

    function stopperAnimations() {
      [liste, ecartesListe].forEach(function (c) {
        if (!c.getAnimations) return;
        c.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
      });
    }

    // Place les éléments dans l'ordre voulu ; avec animation, chacun glisse de son ancienne
    // position vers la nouvelle (technique « FLIP » : seul transform est animé).
    function placer(elements, animer, duree) {
      var avant = new Map();
      if (animer) {
        Array.prototype.forEach.call(liste.children, function (el) { avant.set(el, el.getBoundingClientRect().top); });
      }
      var garder = new Set(elements);
      Array.prototype.slice.call(liste.children).forEach(function (el) { if (!garder.has(el)) liste.removeChild(el); });
      elements.forEach(function (el) { liste.appendChild(el); });
      if (!animer || !document.body.animate) return Promise.resolve();
      var fins = [];
      elements.forEach(function (el) {
        var apres = el.getBoundingClientRect().top;
        if (avant.has(el)) {
          var dy = avant.get(el) - apres;
          if (Math.abs(dy) > .5) {
            el.style.zIndex = dy > 0 ? '2' : '1';
            fins.push(el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: duree, easing: COURBE }).finished
              .then(function () { el.style.zIndex = ''; }, function () { el.style.zIndex = ''; }));
          }
        } else {
          fins.push(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duree * .7, delay: duree * .3, easing: 'ease-out', fill: 'backwards' }).finished.catch(function () {}));
        }
      });
      return Promise.all(fins);
    }

    function fondu() {
      if (liste.animate) liste.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
    }

    function etatInitial() {
      stopperAnimations();
      mails.forEach(function (m) {
        var el = els[m.id];
        el.className = 'rfd-mail';
        el.style.zIndex = '';
        el.querySelector('.rfd-etiquettes').textContent = '';
      });
      placer(mails.map(function (m) { return els[m.id]; }), false);
      ecartesListe.textContent = '';
      ecartesListe.hidden = true;
      ecartesBtn.setAttribute('aria-expanded', 'false');
      ecartes.hidden = true;
      compte.textContent = mails.length + ' mails';
      resume.textContent = '';
      reinit.hidden = true;
      liste.scrollTop = 0;
    }

    function cles(liste) { return liste.map(function (m) { return els[m.id]; }); }

    async function trier(nom) {
      var sc = SCENARIOS[nom];
      if (!sc) return;
      var mon = ++jeton;
      var anime = !reduit.matches;
      var v = dejaTrie ? .6 : 1; // changement de scénario : tri rejoué en accéléré
      dejaTrie = true;
      function actif() { return mon === jeton; }

      Array.prototype.forEach.call(boutons, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scenario') === nom)); });
      etatInitial();

      // 1) Pubs écartées
      pubs.forEach(function (m) { etiquette(m, 'Pub', 'rfd-e-pub'); });
      if (anime) {
        await attendre(220 * v);
        if (!actif()) return;
        await Promise.all(pubs.map(function (m) {
          return els[m.id].animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(64px)', opacity: 0 }], { duration: 300 * v, easing: 'ease-in', fill: 'forwards' }).finished.catch(function () {});
        }));
        if (!actif()) return;
      }
      await placer(cles(gardes), anime, DUREE * v);
      if (!actif()) return;
      pubs.forEach(function (m) {
        var el = els[m.id];
        if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
        ecartesListe.appendChild(el);
      });
      ecartes.hidden = false;
      ecartesBtn.firstChild.textContent = pubs.length + ' pubs écartées automatiquement';
      compte.textContent = gardes.length + ' mails · ' + pubs.length + ' pubs écartées';

      // 2) Urgents en haut
      urgents.forEach(function (m) { etiquette(m, 'Urgent', 'rfd-e-urgent'); els[m.id].classList.add('rfd-urgent'); });
      if (anime) { await attendre(160 * v); if (!actif()) return; }
      var reste = gardes.filter(function (m) { return !m.urgent; });
      await placer([groupe('urgent', 'Urgent')].concat(cles(urgents), cles(reste)), anime, DUREE * v);
      if (!actif()) return;

      // 3) Regroupement selon le scénario
      if (anime) { await attendre(160 * v); if (!actif()) return; }
      gardes.forEach(function (m) { var t = sc.etiquette(m); if (t) etiquette(m, t); });
      var ordre = [groupe('urgent', 'Urgent')].concat(cles(urgents));
      var places = {};
      sc.groupes.forEach(function (g, i) {
        var lot = reste.filter(g.filtre);
        if (g.tri) lot.sort(g.tri);
        if (!lot.length) return;
        ordre.push(groupe(nom + i, g.titre));
        lot.forEach(function (m) { places[m.id] = true; ordre.push(els[m.id]); });
      });
      var autres = reste.filter(function (m) { return !places[m.id]; });
      if (autres.length) {
        ordre.push(groupe('autres', 'Autres'));
        autres.forEach(function (m) { els[m.id].classList.add('rfd-attenue'); ordre.push(els[m.id]); });
      }
      await placer(ordre, anime, DUREE * 1.1 * v);
      if (!actif()) return;
      if (!anime) fondu();

      // Si le groupe du scénario est sous les urgents, hors de la zone visible, on fait défiler
      // la boîte jusqu'à lui (instantané avec « réduire les animations »).
      var premier = groupes[nom + '0'];
      if (premier && premier.offsetTop + 150 > liste.scrollTop + liste.clientHeight) {
        var haut = premier.offsetTop - 8;
        if (anime && 'scrollBehavior' in document.documentElement.style) liste.scrollTo({ top: haut, behavior: 'smooth' });
        else liste.scrollTop = haut;
        if (anime) { await attendre(450); if (!actif()) return; }
      }

      // Résumé (annoncé aux lecteurs d'écran)
      var n = { opp: 0, devis: 0, offre: 0, fou: 0, reponse: 0, relance: 0 };
      gardes.forEach(function (m) {
        if (m.cat === 'opp') { n.opp++; n[m.sous]++; }
        if (m.cat === 'fou') n.fou++;
        if (m.cat === 'cli') n[m.sous]++;
      });
      resume.textContent = pubs.length + ' pubs écartées · ' + urgents.length + ' mails urgents remontés en haut · ' + sc.resume(n) + '.';
      reinit.hidden = false;
    }

    Array.prototype.forEach.call(boutons, function (b) {
      b.addEventListener('click', function () { trier(b.getAttribute('data-scenario')); });
    });
    reinit.addEventListener('click', function () {
      jeton++;
      dejaTrie = false;
      Array.prototype.forEach.call(boutons, function (b) { b.setAttribute('aria-pressed', 'false'); });
      etatInitial();
      fondu();
      if (boutons[0]) boutons[0].focus();
    });
    ecartesBtn.addEventListener('click', function () {
      var ouvert = ecartesBtn.getAttribute('aria-expanded') === 'true';
      ecartesBtn.setAttribute('aria-expanded', String(!ouvert));
      ecartesListe.hidden = ouvert;
    });

    etatInitial();
  }

  function demarrer() {
    var blocs = document.querySelectorAll('[data-rfd-tri]');
    for (var i = 0; i < blocs.length; i++) initialiser(blocs[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
