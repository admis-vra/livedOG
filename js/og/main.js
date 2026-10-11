// Entry point for the livedOG home page.
// Order matters: content and motion first, the intro next, and the heavy 3D scene and
// third-party services last, so nothing decorative delays reading the page.

import { initMotion, reducedMotion } from './motion.js';
import { initNav } from './nav.js';
import { runIntro } from './intro.js';
import { initExtras } from './extras.js';
import { initCovers } from './covers.js';
import { buildFlipName } from './name-flip.js';
import { initNowPlaying } from './nowplaying.js';

window.__ogReady = true; // tells the inline watchdog in <head> that the module loaded

const hero = document.querySelector('.hero');
let introDone = false;
let scene = null;

initCovers();
initMotion();
initNav();
initNowPlaying();
initExtras();
initHeroName();

document.addEventListener('og:intro-done', () => {
  introDone = true;
  hero?.classList.add('is-entered');
  scene?.start();
}, { once: true });

runIntro();
loadScene();

const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
idle(() => import('./services.js').then((m) => m.initServices()), { timeout: 4000 });

function initHeroName() {
  const letters = document.querySelector('.hero__letters');
  const mirror = document.querySelector('.hero__mirror');
  if (!letters || !mirror) return;
  const name = buildFlipName(letters);
  const label = mirror.querySelector('.hero__mirror-label');
  mirror.addEventListener('click', () => {
    name.flip(undefined, { animate: !reducedMotion.matches });
    mirror.setAttribute('aria-pressed', String(name.isReal));
    label.textContent = name.isReal ? 'read it forwards' : 'read it backwards';
  });
}

async function loadScene() {
  const host = hero?.querySelector('.hero__scene');
  if (!host) return;
  // Respect data saver; the static fallback already carries the identity
  if (navigator.connection?.saveData) return;

  const { supportsWebGL, mountHeroScene } = await import('./hero-scene.js');
  if (!supportsWebGL()) return;

  try {
    scene = await mountHeroScene({ host, hero, reducedMotion: reducedMotion.matches, autoStart: false });
  } catch (err) {
    // CDN blocked or GPU trouble: keep the fallback and say why in the console only
    console.warn('[livedOG] 3D scene unavailable, using fallback.', err);
    return;
  }

  hero.classList.add('is-scene-ready');
  if (introDone) scene.start();
  if (new URLSearchParams(location.search).has('debug')) window.__ogScene = scene;

  const forge = hero.querySelector('.hero__forge');
  if (forge && !reducedMotion.matches) {
    forge.hidden = false;
    forge.addEventListener('click', () => scene.scatter());
  }
  host.querySelector('canvas')?.addEventListener('click', () => scene.scatter());
}
