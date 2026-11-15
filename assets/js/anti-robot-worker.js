/* Démos RF Digital — calcul anti-robot exécuté en arrière-plan (ne bloque pas la page).
   Reçoit { sel, defi, max } et cherche le nombre n tel que SHA-256(sel + n) = defi. */
self.onmessage = async function (e) {
  var d = e.data || {};
  try {
    self.postMessage({ nombre: await resoudre(d.sel, d.defi, d.max) });
  } catch (err) {
    self.postMessage({ erreur: true });
  }
};

async function resoudre(sel, defiHex, max) {
  var enc = new TextEncoder();
  var cible = new Uint8Array(32);
  for (var i = 0; i < 32; i++) cible[i] = parseInt(defiHex.substr(i * 2, 2), 16);
  var LOT = 256;
  for (var debut = 0; debut <= max; debut += LOT) {
    var fin = Math.min(max, debut + LOT - 1);
    var promesses = [];
    for (var n = debut; n <= fin; n++) promesses.push(crypto.subtle.digest('SHA-256', enc.encode(sel + n)));
    var res = await Promise.all(promesses);
    for (var k = 0; k < res.length; k++) {
      var h = new Uint8Array(res[k]);
      var egal = true;
      for (var j = 0; j < 32; j++) if (h[j] !== cible[j]) { egal = false; break; }
      if (egal) return debut + k;
    }
  }
  throw new Error('introuvable');
}
