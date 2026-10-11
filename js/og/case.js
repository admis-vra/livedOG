// Entry point for case-study pages: same motion system and navigation as home,
// without the intro or the 3D scene so these pages stay light.

import { initMotion } from './motion.js';
import { initNav } from './nav.js';
import { initCovers } from './covers.js';
import { initLightbox } from './extras.js';
import { initNowPlaying } from './nowplaying.js';

window.__ogReady = true;
initCovers();
initMotion();
initNav();
initNowPlaying();
initLightbox();
