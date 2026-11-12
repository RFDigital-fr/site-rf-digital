# rf-digital.fr

Site vitrine de RF Digital : HTML, CSS et JavaScript statiques, sans dépendance externe à l'affichage.

## Pages
- `index.html` : Accueil, Points forts, Logo animé, Services, Méthode, Formules, Démos, Contact.
- `mentions-legales.html`
- `404.html` : chemins en absolu (`/assets/...`), fonctionne à n'importe quelle adresse.

## Réglage des démos
Un seul réglage pour toutes les pages : `assets/js/init.js`, ligne `var DEMOS = false;`.
Passer à `true` affiche la section `#demos` et le lien « Démos » du menu sur toutes les pages.

## Thème
`assets/js/init.js` (chargé dans `<head>`) applique le choix mémorisé (stockage local, clé `rf-theme`, aucun cookie)
ou le réglage du navigateur, sans flash. `assets/js/main.js` gère le bouton soleil/lune et le menu mobile.

## Logo 3D
Source lisible : `src/logo-3d.js`. Fichier publié : `assets/js/logo-3d.min.js` (Three.js 0.160.0 inclus).
Reconstruction :

```bash
npm install
npm run build
```

`node_modules/` est ignoré par Git. Le site publié n'a pas besoin de Node.

## Licences
Polices Montserrat et Inter : SIL Open Font License 1.1 (`assets/fonts/OFL-*.txt`).
Three.js : licence MIT (`assets/vendor/three/LICENSE`).
