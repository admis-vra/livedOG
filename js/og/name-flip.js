// livedOG <-> GODEVIL letter swap.
// GODEVIL is livedOG read backwards, so instead of cross-fading two words we keep the
// same seven letters and physically move each one to its mirrored position (FLIP technique).

export const ALIAS = 'livedOG';
export const REAL = 'GODEVIL';

export function buildFlipName(el, { typed = true } = {}) {
  el.textContent = '';
  el.classList.add('flip-name');

  const letters = ALIAS.split('').map((ch, i, all) => {
    const span = document.createElement('span');
    span.className = 'flip-name__letter';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch;
    span.dataset.alias = ch;
    span.dataset.real = ch.toUpperCase();
    span.style.setProperty('--t', String(i / (all.length - 1)));
    if (typed) span.classList.add('is-typed');
    el.appendChild(span);
    return span;
  });

  let isReal = false;

  const flip = (toReal = !isReal, { animate = true } = {}) => {
    if (toReal === isReal) return;
    isReal = toReal;

    // Measure before cancelling so a letter still in flight continues from where it is
    const first = new Map(letters.map((l) => [l, l.getBoundingClientRect().left]));
    letters.forEach((l) => l.getAnimations().forEach((a) => a.cancel()));
    letters.forEach((l) => { l.textContent = toReal ? l.dataset.real : l.dataset.alias; });
    // Reverse the *current* DOM order (not the original array), so flipping back restores livedOG
    [...el.querySelectorAll(':scope > .flip-name__letter')].reverse().forEach((l) => el.appendChild(l));
    el.classList.toggle('is-real', toReal);
    if (!animate) return;

    // Letters moving left arc over, letters moving right dip under, so they never collide
    const lift = el.getBoundingClientRect().height * 0.42;
    letters.forEach((l, i) => {
      const dx = first.get(l) - l.getBoundingClientRect().left;
      const dy = Math.sign(dx) * lift;
      l.animate([
        { transform: `translate(${dx}px, 0)` },
        { transform: `translate(${dx / 2}px, ${-dy}px) scale(0.86)`, offset: 0.5 },
        { transform: 'translate(0, 0)' }
      ], { duration: 950, delay: i * 30, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
    });
  };

  return { el, letters, flip, get isReal() { return isReal; } };
}
