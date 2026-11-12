// Logo RF Digital en 3D, adapté pour un bloc de la page d'accueil.
// Source : RF_Digital_Dossier/Logo/3d/logo-3d.html (animation de Ruben).
// Conservés à l'identique : PIECES, PALETTES, DEPTH, matériaux, lumières, lueur du noyau (bloom), pose().
// Retirés : boutons, export .glb, OrbitControls (rotation à la souris), zoom, mémorisation propre au logo.
// Ajouts : rendu dans le conteneur #logo-3d (ResizeObserver), fond transparent, couleurs qui suivent le thème du site,
// pause hors écran, l'assemblage démarre quand le bloc devient visible.
// Construction : `npm run build` (esbuild) -> assets/js/logo-3d.min.js (Three.js 0.160.0 inclus, aucun appel externe).

import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const container = document.getElementById('logo-3d');
if (container) {
  try { start(container); } catch (e) { container.classList.remove('is-3d'); }
}

function start(container) {

// ---- logo data, taken from logo-3d-ready.svg (one closed path per piece) ----
const PIECES = [{"id": "noyau", "d": "M128.00 87.15 L87.15 128.00 L128.00 168.85 L168.85 128.00 Z", "role": "accent", "cx": 128.0, "cy": 128.0}, {"id": "facette-haut-droite-1", "d": "M130.00 28.83 L130.00 83.49 L170.32 123.82 L177.86 76.69 Z", "role": "main", "cx": 152.1, "cy": 77.48}, {"id": "facette-haut-droite-2", "d": "M181.36 80.18 L174.03 126.00 L227.17 126.00 Z", "role": "mid", "cx": 194.19, "cy": 110.73}, {"id": "facette-bas-droite-1", "d": "M227.17 130.00 L172.51 130.00 L132.18 170.32 L179.31 177.86 Z", "role": "mid", "cx": 178.52, "cy": 152.1}, {"id": "facette-bas-droite-2", "d": "M175.82 181.36 L130.00 174.03 L130.00 227.17 Z", "role": "main", "cx": 145.27, "cy": 194.19}, {"id": "facette-bas-gauche-1", "d": "M126.00 227.17 L126.00 172.51 L85.68 132.18 L78.14 179.31 Z", "role": "main", "cx": 103.9, "cy": 178.52}, {"id": "facette-bas-gauche-2", "d": "M74.64 175.82 L81.97 130.00 L28.83 130.00 Z", "role": "mid", "cx": 61.81, "cy": 145.27}, {"id": "facette-haut-gauche-1", "d": "M28.83 126.00 L83.49 126.00 L123.82 85.68 L76.69 78.14 Z", "role": "mid", "cx": 77.48, "cy": 103.9}, {"id": "facette-haut-gauche-2", "d": "M80.18 74.64 L126.00 81.97 L126.00 28.83 Z", "role": "main", "cx": 110.73, "cy": 61.81}, {"id": "lettre-1-R", "d": "M47.37 280.00 L52.13 280.00 L45.38 269.87 L46.34 269.38 L47.36 268.59 L48.19 267.61 L48.79 266.47 L49.15 265.23 L49.24 263.94 L49.06 262.67 L48.62 261.46 L47.94 260.37 L47.04 259.44 L45.97 258.72 L44.78 258.24 L43.94 258.06 L43.11 258.00 L36.04 258.00 L36.04 280.00 L40.00 280.00 L40.00 270.32 L40.92 270.32 Z M43.23 261.97 L43.83 262.09 L44.37 262.38 L44.81 262.81 L45.12 263.34 L45.27 263.93 L45.27 264.39 L45.12 264.98 L44.81 265.51 L44.25 266.02 L43.83 266.23 L43.39 266.34 L40.00 266.36 L40.00 261.96 Z", "role": "text", "cx": 42.26, "cy": 268.6}, {"id": "lettre-2-F", "d": "M61.56 280.00 L61.56 271.42 L67.90 271.42 L67.90 267.46 L61.56 267.46 L61.56 261.96 L69.04 261.96 L69.04 258.00 L57.60 258.00 L57.60 280.00 Z", "role": "text", "cx": 61.69, "cy": 267.19}, {"id": "lettre-3-D", "d": "M85.32 280.00 L92.25 279.97 L93.77 279.76 L95.24 279.34 L96.64 278.71 L97.95 277.90 L98.55 277.43 L99.12 276.91 L100.15 275.77 L101.01 274.50 L101.68 273.12 L101.94 272.40 L102.15 271.66 L102.42 270.15 L102.47 269.38 L102.42 267.85 L102.15 266.34 L101.68 264.88 L101.37 264.18 L100.60 262.85 L100.15 262.23 L99.12 261.09 L98.55 260.57 L97.31 259.67 L96.64 259.29 L95.24 258.66 L93.77 258.24 L93.01 258.11 L91.51 258.00 L85.32 258.00 Z M91.45 261.96 L92.94 262.12 L94.34 262.57 L95.62 263.31 L96.71 264.29 L97.58 265.48 L98.01 266.36 L98.31 267.30 L98.51 268.75 L98.41 270.22 L98.01 271.64 L97.32 272.94 L96.37 274.06 L95.21 274.97 L94.34 275.43 L92.94 275.88 L91.97 276.02 L89.28 276.04 L89.28 261.96 Z", "role": "text", "cx": 92.73, "cy": 268.99}, {"id": "lettre-4-I", "d": "M113.92 280.00 L113.92 258.00 L109.96 258.00 L109.96 280.00 Z", "role": "text", "cx": 111.94, "cy": 269.0}, {"id": "lettre-5-G", "d": "M139.15 270.98 L138.59 272.35 L138.13 273.09 L137.58 273.77 L136.60 274.65 L135.87 275.12 L134.68 275.66 L133.84 275.89 L132.54 276.04 L131.23 275.94 L130.38 275.74 L129.17 275.25 L128.07 274.55 L127.41 273.97 L126.58 272.96 L125.95 271.81 L125.65 270.99 L125.45 270.14 L125.36 268.84 L125.51 267.54 L125.90 266.29 L126.52 265.13 L127.04 264.43 L127.98 263.52 L128.69 263.02 L129.86 262.43 L131.12 262.08 L132.43 261.96 L133.73 262.09 L134.99 262.45 L136.15 263.05 L137.19 263.84 L137.83 264.52 L140.79 261.88 L139.89 260.94 L139.37 260.49 L138.27 259.69 L137.07 259.04 L135.80 258.54 L134.48 258.20 L133.80 258.09 L132.47 258.00 L131.76 258.02 L130.41 258.18 L129.74 258.33 L129.08 258.51 L127.81 259.00 L127.20 259.31 L126.04 260.03 L125.49 260.44 L124.49 261.36 L123.60 262.40 L123.21 262.95 L122.53 264.14 L122.01 265.40 L121.64 266.71 L121.52 267.38 L121.40 268.74 L121.41 269.43 L121.45 270.11 L121.68 271.45 L122.06 272.76 L122.32 273.40 L122.61 274.01 L123.30 275.19 L123.70 275.74 L124.61 276.76 L125.63 277.67 L126.75 278.44 L127.96 279.07 L128.60 279.32 L129.90 279.71 L130.57 279.85 L131.93 279.99 L132.61 280.00 L133.30 279.96 L134.65 279.77 L135.96 279.41 L136.60 279.17 L137.22 278.89 L138.41 278.21 L138.97 277.82 L140.01 276.94 L140.49 276.46 L141.35 275.40 L142.07 274.24 L142.38 273.63 L142.88 272.36 L143.21 271.04 L143.38 269.68 L143.46 267.02 L134.16 267.02 L134.16 270.98 Z", "role": "text", "cx": 132.19, "cy": 269.3}, {"id": "lettre-6-I", "d": "M154.84 280.00 L154.84 258.00 L150.88 258.00 L150.88 280.00 Z", "role": "text", "cx": 152.86, "cy": 269.0}, {"id": "lettre-7-T", "d": "M162.32 258.00 L162.32 261.96 L167.16 261.96 L167.16 280.00 L171.12 280.00 L171.12 261.96 L175.96 261.96 L175.96 258.00 Z", "role": "text", "cx": 169.14, "cy": 266.24}, {"id": "lettre-8-A", "d": "M199.68 280.00 L194.46 258.00 L190.02 258.00 L184.80 280.00 L188.87 280.00 L189.86 275.82 L194.62 275.82 L195.61 280.00 Z M190.80 271.86 L192.24 265.79 L193.68 271.86 Z", "role": "text", "cx": 192.24, "cy": 270.09}, {"id": "lettre-9-L", "d": "M219.96 280.00 L219.96 276.04 L212.48 276.04 L212.48 258.00 L208.52 258.00 L208.52 280.00 Z", "role": "text", "cx": 211.95, "cy": 271.29}];
const PALETTES = {
  clair:  { bg: '#FFFFFF', main: '#0B0B0C', mid: '#3A3F48', accent: '#00C8FF', text: '#0B0B0C' },
  sombre: { bg: '#0A0D14', main: '#3E4653', mid: '#66707F', accent: '#00C8FF', text: '#E9ECF1' },
};
const CENTRE = { x: 128, y: 150 };          // centre of the full logo (prism + wordmark) in SVG units
const DEPTH = { facette: 22, noyau: 28, lettre: 6 };
const look = { coreBase: 0.9 };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- renderer, scene, camera ----
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-hidden', 'true');
// transparent background: the page colour shows through (no darker rectangle in dark mode)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = null;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 1, 5000);
camera.position.set(0, 10, 640);
camera.lookAt(0, 0, 0);

const key = new THREE.DirectionalLight('#ffffff', 1.6); key.position.set(250, 300, 500); scene.add(key);
const rim = new THREE.DirectionalLight('#9FE8FF', 1.2); rim.position.set(-400, -100, -300); scene.add(rim);
scene.add(new THREE.AmbientLight('#ffffff', 0.25));

// ---- build the pieces ----
const logo = new THREE.Group();          // whole logo, flipped from SVG coordinates
const sway = new THREE.Group();          // idle motion
sway.add(logo); scene.add(sway);
logo.scale.set(1, -1, 1);

const loader = new SVGLoader();
const svgText = `<svg xmlns="http://www.w3.org/2000/svg">${PIECES.map(p => `<path id="${p.id}" d="${p.d}"/>`).join('')}</svg>`;
const parsed = loader.parse(svgText);
const byId = Object.fromEntries(PIECES.map(p => [p.id, p]));
const meshes = [];

function materialFor(role) {
  if (role === 'accent') {
    return new THREE.MeshPhysicalMaterial({ color: '#00C8FF', emissive: '#00C8FF', emissiveIntensity: 0.9,
      roughness: 0.15, metalness: 0.1, clearcoat: 1, transmission: 0, transparent: true });
  }
  if (role === 'text') {
    return new THREE.MeshStandardMaterial({ color: '#0B0B0C', roughness: 0.45, metalness: 0.2, transparent: true });
  }
  return new THREE.MeshPhysicalMaterial({ color: '#0B0B0C', roughness: 0.28, metalness: 0.55, clearcoat: 0.8,
    clearcoatRoughness: 0.2, transparent: true });
}

for (const path of parsed.paths) {
  const id = path.userData.node.getAttribute('id');
  const info = byId[id];
  const kind = info.role === 'text' ? 'lettre' : (info.role === 'accent' ? 'noyau' : 'facette');
  const depth = DEPTH[kind];
  const shapes = SVGLoader.createShapes(path);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth, curveSegments: 8,
    bevelEnabled: kind !== 'lettre', bevelThickness: 1.6, bevelSize: 1.1, bevelSegments: 3,
  });
  // centre each piece on its own centroid so it can move and spin on itself
  geo.translate(-info.cx, -info.cy, -depth / 2);
  const mesh = new THREE.Mesh(geo, materialFor(info.role));
  mesh.name = id;
  mesh.userData = { role: info.role, kind, home: new THREE.Vector3(info.cx - CENTRE.x, info.cy - CENTRE.y, kind === 'noyau' ? 4 : 0) };
  mesh.position.copy(mesh.userData.home);
  logo.add(mesh);
  meshes.push(mesh);
}

// ---- post-processing: a soft glow on the cyan core ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.4, 0.82);
// The bloom blur writes alpha = 1 everywhere, which would paint an opaque rectangle over the page.
// Keep the glow colour (additive, as in the original) but leave the transparency of the render untouched.
bloom.blendMaterial.blending = THREE.CustomBlending;
bloom.blendMaterial.blendEquation = THREE.AddEquation;
bloom.blendMaterial.blendSrc = THREE.OneFactor;
bloom.blendMaterial.blendDst = THREE.OneFactor;
bloom.blendMaterial.blendEquationAlpha = THREE.AddEquation;
bloom.blendMaterial.blendSrcAlpha = THREE.ZeroFactor;
bloom.blendMaterial.blendDstAlpha = THREE.OneFactor;
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- palettes (follow the site theme: <html data-theme="light|dark">) ----
function applyPalette(name) {
  const p = PALETTES[name];
  for (const m of meshes) {
    m.material.color.set(p[m.userData.role]);
  }
  const dark = name === 'sombre';
  // light: no tone mapping so white stays white and black stays black; dark: filmic look + glow on the core
  renderer.toneMapping = dark ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = dark ? 1.05 : 1.0;
  bloom.strength = dark ? 0.45 : 0.0;
  bloom.threshold = dark ? 0.9 : 1.0;
  look.coreBase = dark ? 0.9 : 0.25;
  for (const m of meshes) {
    m.material.envMapIntensity = m.userData.kind === 'facette' ? (dark ? 0.45 : 0.35) : (dark ? 0.3 : 0.2);
    m.material.needsUpdate = true;
  }
  requestFrame();
}
const themeName = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'sombre' : 'clair');

// ---- assembly animation ----
const facettes = meshes.filter(m => m.userData.kind === 'facette');
const noyau = meshes.find(m => m.userData.kind === 'noyau');
const lettres = meshes.filter(m => m.userData.kind === 'lettre');

const easeOutBack = x => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeOut = x => 1 - Math.pow(1 - x, 3);
const clamp01 = x => Math.min(1, Math.max(0, x));

// Clock of the animation in seconds. It only advances while the block is visible,
// so the assembly starts when the visitor reaches the block and resumes where it stopped.
let elapsed = 0;

function pose() {
  const s = reduceMotion ? 99 : elapsed;
  facettes.forEach((m, i) => {
    const k = clamp01((s - i * 0.09) / 1.1);
    const e = easeOutBack(k);
    const home = m.userData.home;
    const dir = new THREE.Vector3(home.x, home.y, 0).normalize();
    m.position.set(home.x + dir.x * 220 * (1 - e), home.y + dir.y * 220 * (1 - e), home.z + 160 * (1 - e));
    m.rotation.set((1 - e) * 1.6 * (i % 2 ? 1 : -1), (1 - e) * 2.2, (1 - e) * 0.8);
    m.material.opacity = clamp01(k * 3);
  });
  const kc = clamp01((s - 1.25) / 0.6);
  noyau.scale.setScalar(Math.max(0.001, easeOutBack(kc)));
  noyau.material.emissiveIntensity = look.coreBase + 2.4 * Math.max(0, 1 - Math.abs(kc - 0.5) * 2) * (kc < 1 ? 1 : 0);
  noyau.material.opacity = clamp01(kc * 4);
  lettres.forEach((m, i) => {
    const k = easeOut(clamp01((s - 1.7 - i * 0.04) / 0.7));
    m.position.set(m.userData.home.x, m.userData.home.y - 18 * (1 - k), 0);
    m.material.opacity = k;
  });
  // idle sway once assembled (slow automatic rotation)
  const idle = clamp01((s - 2.6) / 1.5);
  sway.rotation.y = Math.sin(s * 0.5) * 0.35 * idle;
  sway.rotation.x = Math.sin(s * 0.33) * 0.06 * idle;
}

// ---- size of the block ----
function resize() {
  const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h;
  camera.position.setLength(w < 600 ? 820 : 640);
  camera.updateProjectionMatrix();
  requestFrame();
}
new ResizeObserver(resize).observe(container);

// ---- loop: runs only while the block is on screen and the tab is visible ----
let visible = false, raf = 0, last = 0;
function canRun() { return visible && !document.hidden && container.clientWidth > 0; }
function loop(time) {
  raf = 0;
  if (!canRun()) return;
  if (last) elapsed += Math.min(0.1, (time - last) / 1000);
  last = time;
  pose();
  composer.render();
  raf = requestAnimationFrame(loop);
}
function requestFrame() {
  if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(loop); }
}
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) requestFrame();
}, { threshold: 0.15 }).observe(container);
document.addEventListener('visibilitychange', requestFrame);

// follow the soleil/lune button and the browser setting
new MutationObserver(() => applyPalette(themeName()))
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

applyPalette(themeName());
pose();
container.appendChild(canvas);
container.classList.add('is-3d');
resize();

}
