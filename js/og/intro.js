// Opening sequence: type "livedOG", swap it into "GODEVIL", swap back, then get out of the way.
// Plays whenever the home page is opened or reloaded (the inline script in <head> marks
// in-site navigation as "intro-seen"). It finishes on its own and any input skips it,
// so visitors are never held hostage before reaching the content.

import { buildFlipName } from './name-flip.js';
import { reducedMotion } from './motion.js';

const CAPTIONS = {
  alias: ['lived + OG', 'lived it. stayed original.'],
  real: ['GO + DEVIL', 'the real name, read backwards.'],
  still: ['livedOG ⇄ GODEVIL', 'same letters, read backwards.']
};

export function runIntro() {
  const intro = document.getElementById('intro');
  const done = () => document.dispatchEvent(new CustomEvent('og:intro-done'));

  if (!intro || document.documentElement.classList.contains('intro-seen')) {
    intro?.remove();
    done();
    return;
  }

  const title = intro.querySelector('.intro__title');
  const caption = intro.querySelector('.intro__caption');
  const name = buildFlipName(title, { typed: reducedMotion.matches });
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  const showCaption = ([main, sub]) => {
    caption.innerHTML = `<span>${main}</span><small>${sub}</small>`;
    caption.classList.add('is-visible');
  };
  const setCaption = (text) => {
    caption.classList.remove('is-visible');
    at(220, () => showCaption(text));
  };

  if (reducedMotion.matches) {
    // Reduced motion: the same identity statement, held still, then a quiet exit
    showCaption(CAPTIONS.still);
    at(2000, finish);
  } else {
    // Timeline (ms). Kept short: ~5s total, every step skippable.
    name.letters.forEach((l, i) => at(250 + i * 110, () => l.classList.add('is-typed')));
    at(1100, () => setCaption(CAPTIONS.alias));
    at(2300, () => { name.flip(true); at(450, () => setCaption(CAPTIONS.real)); });
    at(4000, () => { name.flip(false); });
    at(5000, finish);
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    events.forEach((type) => window.removeEventListener(type, finish, listenerOpts));
    intro.classList.add('is-leaving');
    done();
    setTimeout(() => intro.remove(), 700);
  }

  // Scrolling, clicking, tapping or pressing a key all end the intro immediately
  const events = ['pointerdown', 'keydown', 'wheel', 'touchmove'];
  const listenerOpts = { passive: true };
  events.forEach((type) => window.addEventListener(type, finish, listenerOpts));
}
