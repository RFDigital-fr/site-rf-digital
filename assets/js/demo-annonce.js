/* Démos RF Digital — démo 2 « Création d'annonces ».
   Le visiteur dépose une photo, indique neuf ou occasion (et l'état), choisit sa stratégie de prix ;
   la fonction serveur RF Digital fait analyser la photo par l'IA et renvoie l'annonce. Puis simulation,
   entièrement dans le navigateur, sur 3 plateformes FICTIVES (publication, vues, message, vente, stock).
   Aucun cookie, aucun stockage, aucun service tiers : seul l'appel à la fonction serveur.
   La photo reste en mémoire le temps de l'envoi, puis elle est oubliée.
   Réglage : data-endpoint du bloc [data-rfd-annonce]. data-endpoint="simulation" : faux serveur local
   (aucun appel) ; data-simulation="refus|limite_visiteur|quota_jour|indisponible|technique|robot" force un cas.
   Nécessite demo-annonce-photo.js (chargé avant). */
(function () {
  'use strict';

  var script = document.currentScript;
  var URL_WORKER = script && script.src ? script.src.replace(/[^/]*$/, 'anti-robot-worker.js') : 'anti-robot-worker.js';
  var REDUIT = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MESSAGES = {
    format: 'Ce format n’est pas accepté. Choisissez une photo JPG, PNG ou HEIC.',
    taille: 'Cette photo dépasse 5 Mo. Choisissez une photo plus légère.',
    heic: 'Votre navigateur ne sait pas lire ce format. Choisissez une photo JPG ou PNG.',
    illisible: 'Cette photo n’a pas pu être lue. Choisissez une autre photo JPG, PNG ou HEIC.',
    photo_absente: 'Ajoutez d’abord la photo de votre produit.',
    photo: 'Cette photo n’a pas pu être lue. Choisissez une autre photo JPG, PNG ou HEIC.',
    refus: 'Nous n’avons pas pu créer d’annonce à partir de cette photo. Essayez avec la photo d’un produit.',
    limite_visiteur: 'Vous avez déjà essayé la démo aujourd’hui. Revenez demain !',
    quota_jour: 'La démo a beaucoup servi aujourd’hui. Revenez demain !',
    indisponible: 'La démo est momentanément indisponible. Revenez un peu plus tard.',
    robot: 'La vérification automatique a échoué. Rechargez la page et réessayez.',
    technique: 'Un souci technique empêche l’analyse. Réessayez dans quelques minutes.'
  };

  var NOMS_NIVEAUX = { rapide: 'Vente rapide', marche: 'Prix du marché', haut: 'Prix haut' };
  var STRATEGIE_NIVEAU = { 'Vendre vite': 'rapide', 'Prix du marché': 'marche', 'Un peu au-dessus': 'haut' };
  var ACHETEURS = [
    { nom: 'Claire', texte: 'Bonjour, votre annonce « {t} » est-elle toujours disponible ? Je peux passer la chercher demain.' },
    { nom: 'Julien', texte: 'Bonjour ! Intéressé par « {t} ». Toujours en vente ? Je peux payer tout de suite.' },
    { nom: 'Sofia', texte: 'Bonjour, « {t} » m’intéresse beaucoup. Est-ce encore possible de l’acheter ?' }
  ];

  var euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function prix(n) { return euros.format(n).replace(/ /g, ' '); }
  function pourcent(f) { return f === 0 ? 'aucun' : Math.round(f * 100) + ' %'; }
  function attendre(ms) { return new Promise(function (ok) { setTimeout(ok, REDUIT ? Math.min(ms, 400) : ms); }); }

  function initialiser(bloc) {
    var endpoint = (bloc.getAttribute('data-endpoint') || '').replace(/\/+$/, '');
    var simulationCode = bloc.getAttribute('data-simulation') || '';
    var form = bloc.querySelector('.rfd-a-form');
    var fichier = form.querySelector('input[type="file"]');
    var zone = form.querySelector('[data-zone]');
    var vignette = form.querySelector('.rfd-a-vignette');
    var etats = form.querySelector('.rfd-a-etats');
    var piege = form.querySelector('.rfd-piege input');
    var bouton = form.querySelector('button[type="submit"]');
    var message = form.querySelector('.rfd-message');
    var analyse = bloc.querySelector('.rfd-a-analyse');
    var etape = bloc.querySelector('.rfd-a-etape');
    var vueAnnonce = bloc.querySelector('.rfd-a-annonce');
    var simu = bloc.querySelector('.rfd-a-simu');
    var affiche = Date.now();
    var photo = null; // { base64, url } : en mémoire uniquement
    var calcul = null;
    var enCours = false;
    var annonce = null;
    var jeton = 0; // annule une simulation en cours si on la rejoue

    function afficherMessage(texte, err) {
      message.textContent = texte || '';
      message.classList.toggle('rfd-erreur', !!err);
      // Sur iPhone, le message peut être sous le bas de l'écran : on l'amène dans la vue.
      if (texte && message.scrollIntoView) message.scrollIntoView({ block: 'center' });
    }

    // ----- Neuf / occasion -----
    form.addEventListener('change', function (e) {
      if (e.target.name === 'rfd-a-type') etats.hidden = e.target.value !== 'occasion';
    });

    // ----- Photo -----
    function oublierPhoto() {
      if (photo && photo.url) URL.revokeObjectURL(photo.url);
      photo = null;
    }
    fichier.addEventListener('change', function () {
      var f = fichier.files && fichier.files[0];
      afficherMessage('');
      if (!f) return;
      preparer(); // l'anti-robot démarre en arrière-plan
      window.RFDPhotoAnnonce.preparer(f).then(function (p) {
        oublierPhoto();
        photo = p;
        vignette.querySelector('img').src = p.url;
        vignette.hidden = false;
        zone.hidden = true;
      }, function (e) {
        afficherMessage(MESSAGES[e && e.code] || MESSAGES.illisible, true);
      }).then(function () { fichier.value = ''; }); // le fichier d'origine n'est pas gardé
    });
    ['dragover', 'dragenter'].forEach(function (t) {
      zone.addEventListener(t, function (e) { e.preventDefault(); zone.classList.add('rfd-a-survol'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      zone.addEventListener(t, function () { zone.classList.remove('rfd-a-survol'); });
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      try { var dt = new DataTransfer(); dt.items.add(f); fichier.files = dt.files; } catch (x) { return; }
      fichier.dispatchEvent(new Event('change'));
    });

    // ----- Anti-robot (même principe que la démo 1) -----
    function preparer() {
      if (calcul && Date.now() - calcul.recu < 8 * 60 * 1000) return calcul.promesse;
      var recu = Date.now();
      var promesse = obtenirDefi().then(function (d) {
        return resoudre(d).then(function (n) {
          return { sel: d.sel, defi: d.defi, max: d.max, expire: d.expire, signature: d.signature, nombre: n };
        });
      });
      promesse.catch(function () { calcul = null; });
      calcul = { promesse: promesse, recu: recu };
      return promesse;
    }
    function obtenirDefi() {
      if (endpoint === 'simulation') return Promise.resolve({ sel: 'simulation', defi: '', max: 0, expire: 0, signature: '' });
      return fetch(endpoint + '/defi', { method: 'GET', credentials: 'omit', cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('defi'); return r.json(); });
    }
    function resoudre(d) {
      if (endpoint === 'simulation') return attendre(500).then(function () { return 0; });
      return new Promise(function (ok, ko) {
        var w;
        try { w = new Worker(URL_WORKER); } catch (e) { w = null; }
        if (!w) return resoudreIci(d).then(ok, ko);
        w.onmessage = function (e) { w.terminate(); if (e.data && typeof e.data.nombre === 'number') ok(e.data.nombre); else ko(new Error('calcul')); };
        w.onerror = function () { w.terminate(); resoudreIci(d).then(ok, ko); };
        w.postMessage({ sel: d.sel, defi: d.defi, max: d.max });
      });
    }
    function resoudreIci(d) {
      var enc = new TextEncoder();
      var n = 0;
      function lot() {
        var p = [];
        var debut = n;
        for (var i = 0; i < 256 && n <= d.max; i++, n++) p.push(crypto.subtle.digest('SHA-256', enc.encode(d.sel + n)));
        return Promise.all(p).then(function (res) {
          for (var k = 0; k < res.length; k++) {
            var h = Array.prototype.map.call(new Uint8Array(res[k]), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
            if (h === d.defi) return debut + k;
          }
          if (n > d.max) throw new Error('introuvable');
          return lot();
        });
      }
      return lot();
    }

    // ----- Envoi -----
    function valeur(nom) { var c = form.querySelector('input[name="' + nom + '"]:checked'); return c ? c.value : ''; }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (enCours) return;
      afficherMessage('');
      if (!photo) { afficherMessage(MESSAGES.photo_absente, true); zone.focus && zone.focus(); return; }
      var etat = valeur('rfd-a-type') === 'occasion' ? valeur('rfd-a-etat') : 'neuf';
      var strategie = valeur('rfd-a-strategie');

      enCours = true;
      bouton.disabled = true;
      form.hidden = true;
      analyse.hidden = false;
      etape.textContent = 'Analyse de la photo…';
      var t = setTimeout(function () { etape.textContent = 'Rédaction de l’annonce…'; }, 2200);

      preparer()
        .then(function (solution) {
          var corps = {
            photo: photo.base64, etat: etat, strategie: strategie,
            piege: piege ? piege.value : '', duree_saisie: Date.now() - affiche, solution: solution
          };
          if (endpoint === 'simulation') return simuler(etat, strategie);
          return fetch(endpoint + '/creer', {
            method: 'POST', credentials: 'omit',
            headers: { 'content-type': 'application/json' }, body: JSON.stringify(corps)
          }).then(function (r) { return r.json().catch(function () { return { ok: false, code: 'technique' }; }); });
        })
        .catch(function () { return { ok: false, code: 'technique' }; })
        .then(function (rep) {
          clearTimeout(t);
          enCours = false;
          bouton.disabled = false;
          calcul = null; // un défi ne sert qu'une fois
          analyse.hidden = true;
          if (rep && rep.ok && rep.annonce) {
            var url = photo.url;
            photo.base64 = null; // la photo n'est plus utile : seule la vignette reste affichée
            return afficherAnnonce(rep.annonce, url);
          }
          form.hidden = false;
          afficherMessage(MESSAGES[rep && rep.code] || MESSAGES.technique, true);
          if (rep && rep.code === 'refus') {
            oublierPhoto();
            vignette.hidden = true;
            zone.hidden = false;
          }
        });
    });

    // Faux serveur pour tester l'affichage sans appel (prix inventés, cohérents avec l'état et la stratégie).
    function simuler(etat, strategie) {
      return attendre(1600).then(function () {
        if (simulationCode) return { ok: false, code: simulationCode };
        var coef = { neuf: 1, comme_neuf: .78, tres_bon: .62, bon: .48, correct: .33 }[etat];
        var m = Math.round(129 * coef);
        var p = { rapide: Math.round(m * .78), marche: m, haut: Math.round(m * 1.1) };
        var r = p[strategie];
        var noms = { neuf: 'Neuf', comme_neuf: 'Comme neuf', tres_bon: 'Très bon état', bon: 'Bon état', correct: 'État correct' };
        var strats = { rapide: 'Vendre vite', marche: 'Prix du marché', haut: 'Un peu au-dessus' };
        return { ok: true, annonce: {
          titre: 'Casque audio sans fil noir (exemple de simulation)',
          description: 'Texte d’exemple affiché en mode simulation, sans appel à l’IA. Casque audio sans fil de couleur noire, arceau réglable et coussinets souples. N’hésitez pas à me contacter pour plus d’informations.',
          categorie: 'High-tech et téléphonie', etat: noms[etat], strategie: strats[strategie], prix: p, prix_retenu: r,
          plateformes: [
            { id: 'brocantia', nom: 'Brocantia', frais: 0, prix: r },
            { id: 'ventelia', nom: 'Ventélia', frais: .05, prix: Math.ceil(r / .95) },
            { id: 'kiosquo', nom: 'Kiosquo', frais: .08, prix: Math.ceil(r / .92) }
          ]
        } };
      });
    }

    // ----- Affichage de l'annonce -----
    function el(tag, classe, texte) {
      var e = document.createElement(tag);
      if (classe) e.className = classe;
      if (texte != null) e.textContent = texte;
      return e;
    }
    function logo(p) { var s = el('span', 'rfd-a-logo', p.nom.charAt(0)); s.setAttribute('data-p', p.id); s.setAttribute('aria-hidden', 'true'); return s; }

    function afficherAnnonce(a, url) {
      annonce = a;
      form.hidden = true;
      vueAnnonce.hidden = false;
      var img = vueAnnonce.querySelector('.rfd-a-annonce-img');
      img.src = url;
      vueAnnonce.querySelector('.rfd-a-meta').textContent = a.categorie + ' · ' + a.etat;
      var titre = vueAnnonce.querySelector('.rfd-a-annonce-titre');
      titre.textContent = a.titre;
      vueAnnonce.querySelector('.rfd-a-description').textContent = a.description;

      var retenu = STRATEGIE_NIVEAU[a.strategie] || 'marche';
      var zonePrix = vueAnnonce.querySelector('.rfd-a-prix');
      zonePrix.textContent = '';
      ['rapide', 'marche', 'haut'].forEach(function (n) {
        var b = el('div', 'rfd-a-niveau' + (n === retenu ? ' rfd-a-retenu' : ''));
        b.appendChild(el('span', 'rfd-a-nom', NOMS_NIVEAUX[n]));
        b.appendChild(el('span', 'rfd-a-montant', prix(a.prix[n])));
        b.appendChild(el('span', 'rfd-a-indic', n === retenu ? 'Votre choix · estimation indicative' : 'Estimation indicative'));
        zonePrix.appendChild(b);
      });

      var corps = vueAnnonce.querySelector('.rfd-a-plateformes tbody');
      corps.textContent = '';
      a.plateformes.forEach(function (p) {
        var tr = el('tr');
        var td1 = el('td'); var nom = el('span', 'rfd-a-nomplat'); nom.appendChild(logo(p)); nom.appendChild(document.createTextNode(p.nom)); td1.appendChild(nom);
        var td3 = el('td'); td3.appendChild(el('strong', null, prix(p.prix))); td3.appendChild(el('small', null, 'Estimation indicative'));
        tr.appendChild(td1); tr.appendChild(el('td', null, pourcent(p.frais))); tr.appendChild(td3);
        corps.appendChild(tr);
      });
      titre.focus();
    }

    // ----- Simulation : publication, vues, message, vente, mise à jour du stock -----
    vueAnnonce.querySelector('[data-publier]').addEventListener('click', function () {
      this.hidden = true;
      lancerSimulation();
    });
    simu.querySelector('[data-rejouer]').addEventListener('click', lancerSimulation);

    function lancerSimulation() {
      var moi = ++jeton;
      var vivant = function () { return moi === jeton; };
      var a = annonce;
      var direct = simu.querySelector('.rfd-a-annonce-direct');
      var liste = simu.querySelector('.rfd-a-cartes');
      var stock = simu.querySelector('[data-stock]');
      var fin = simu.querySelector('.rfd-a-fin');
      simu.hidden = false;
      fin.hidden = true;
      stock.textContent = '1';
      liste.textContent = '';
      var cartes = a.plateformes.map(function (p) {
        var li = el('li', 'rfd-a-carte rfd-a-apparait');
        var l1 = el('div', 'rfd-a-carte-l1');
        var nom = el('span', 'rfd-a-nomplat'); nom.appendChild(logo(p)); nom.appendChild(document.createTextNode(p.nom));
        l1.appendChild(nom); l1.appendChild(el('span', 'rfd-a-carte-prix', prix(p.prix)));
        var statut = el('span', 'rfd-a-statut', 'Publication…'); statut.setAttribute('data-s', 'publication');
        var vues = el('span', 'rfd-a-vues', '');
        li.appendChild(l1); li.appendChild(statut); li.appendChild(vues);
        liste.appendChild(li);
        return { p: p, li: li, statut: statut, vues: vues, n: 0 };
      });
      function dire(t) { direct.textContent = t; }
      function etatCarte(c, s, texte) { c.statut.setAttribute('data-s', s); c.statut.textContent = texte; }

      var vendeur = cartes[Math.floor(Math.random() * cartes.length)];
      var acheteur = ACHETEURS[Math.floor(Math.random() * ACHETEURS.length)];
      var minuterie = null;

      dire('Publication de l’annonce sur les 3 plateformes.');
      attendre(700).then(function () {
        if (!vivant()) return;
        return cartes.reduce(function (chaine, c, i) {
          return chaine.then(function () { return attendre(i ? 450 : 0); }).then(function () {
            if (!vivant()) return;
            etatCarte(c, 'en_ligne', 'En ligne');
            c.vues.textContent = '0 vue';
          });
        }, Promise.resolve());
      }).then(function () {
        if (!vivant()) return;
        dire('Annonce en ligne sur Brocantia, Ventélia et Kiosquo.');
        minuterie = setInterval(function () {
          if (!vivant()) return clearInterval(minuterie);
          cartes.forEach(function (c) {
            if (c.statut.getAttribute('data-s') !== 'en_ligne') return;
            c.n += 1 + Math.floor(Math.random() * 4);
            c.vues.textContent = c.n + (c.n > 1 ? ' vues' : ' vue');
          });
        }, REDUIT ? 900 : 450);
        return attendre(3200);
      }).then(function () {
        if (!vivant()) return;
        var msg = el('p', 'rfd-a-msg rfd-a-apparait');
        msg.appendChild(el('b', null, 'Message de ' + acheteur.nom + ' · ' + vendeur.p.nom));
        msg.appendChild(document.createTextNode(acheteur.texte.replace('{t}', a.titre)));
        vendeur.li.appendChild(msg);
        dire('Nouveau message d’un acheteur sur ' + vendeur.p.nom + '.');
        return attendre(3000);
      }).then(function () {
        if (!vivant()) return;
        etatCarte(vendeur, 'vendu', 'Vendu · ' + prix(vendeur.p.prix));
        vendeur.li.classList.add('rfd-a-vendu');
        dire('Vendu sur ' + vendeur.p.nom + ' à ' + prix(vendeur.p.prix) + '.');
        return attendre(1200);
      }).then(function () {
        if (!vivant()) return;
        stock.textContent = '0';
        dire('Stock mis à jour : 0 article.');
        return attendre(1000);
      }).then(function () {
        if (!vivant()) return;
        return cartes.filter(function (c) { return c !== vendeur; }).reduce(function (chaine, c, i) {
          return chaine.then(function () { return attendre(i ? 600 : 0); }).then(function () {
            if (!vivant()) return;
            etatCarte(c, 'retiree', 'Retirée automatiquement');
            c.li.classList.add('rfd-a-retiree');
          });
        }, Promise.resolve());
      }).then(function () {
        clearInterval(minuterie);
        if (!vivant()) return;
        dire('Annonce retirée des autres plateformes. Simulation terminée.');
        return attendre(800).then(function () { if (vivant()) fin.hidden = false; });
      });
    }
  }

  function demarrer() {
    var blocs = document.querySelectorAll('[data-rfd-annonce]');
    for (var i = 0; i < blocs.length; i++) initialiser(blocs[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
