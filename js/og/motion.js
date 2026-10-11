// Shared motion system for the livedOG redesign.
// Three levels: ambient (CSS), interactive (tilt / spotlight), narrative (reveals, scroll progress).
// Everything respects prefers-reduced-motion and is driven by at most one rAF per frame.

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/* ---------- Narrative: reveal on enter ---------- */

let revealObserver = null;

export function revealAll(root = document) {
  const nodes = root.querySelectorAll('[data-reveal]:not(.is-in)');
  if (!nodes.length) return;

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    nodes.forEach((n) => n.classList.add('is-in'));
    return;
  }

  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  // Children of a [data-reveal-group] stagger in order; the delay is capped so long lists don't drag
  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll(':scope > [data-reveal]').forEach((child, i) => {
      child.style.setProperty('--reveal-delay', `${Math.min(i * 70, 420)}ms`);
    });
  });

  nodes.forEach((n) => revealObserver.observe(n));
}

/* ---------- Interactive: pointer tilt + spotlight ---------- */

// Tilt is eased toward its target every frame rather than set directly, which keeps
// fast pointer movement smooth and lets the card settle back when the pointer leaves.
export function initTilt(root = document) {
  if (reducedMotion.matches || !finePointer.matches) return;

  root.querySelectorAll('[data-tilt]').forEach((el) => {
    if (el.dataset.tiltReady) return;
    el.dataset.tiltReady = '1';
    const max = Number(el.dataset.tilt) || 6;
    const state = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };

    const step = () => {
      state.x += (state.tx - state.x) * 0.12;
      state.y += (state.ty - state.y) * 0.12;
      el.style.setProperty('--tilt-x', `${state.x.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${state.y.toFixed(2)}deg`);
      const settled = Math.abs(state.tx - state.x) < 0.01 && Math.abs(state.ty - state.y) < 0.01;
      state.raf = settled ? 0 : requestAnimationFrame(step);
    };
    const kick = () => { if (!state.raf) state.raf = requestAnimationFrame(step); };

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      state.ty = (px - 0.5) * max * 2;
      state.tx = (0.5 - py) * max * 2;
      kick();
    });
    el.addEventListener('pointerleave', () => {
      state.tx = 0;
      state.ty = 0;
      kick();
    });
  });
}

// Cards read --mx/--my for a radial light that follows the pointer. One delegated
// listener covers every card on the page, including ones rendered later.
export function initSpotlight() {
  if (!finePointer.matches) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.card, [data-spotlight]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ---------- Narrative: scroll progress ---------- */

// Elements with [data-progress] get --p (0 → 1) as they travel through the viewport.
// Only elements currently on screen are measured, and work happens once per frame.
export function initScrollProgress() {
  const els = [...document.querySelectorAll('[data-progress]')];
  if (!els.length || reducedMotion.matches) return;

  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    schedule();
  });
  els.forEach((el) => io.observe(el));

  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    visible.forEach((el) => {
      const r = el.getBoundingClientRect();
      // 'exit' measures how far the element has scrolled out of the top (hero);
      // the default measures its full trip from entering at the bottom to leaving at the top.
      const p = el.dataset.progress === 'exit'
        ? clamp(-r.top / r.height)
        : clamp((vh - r.top) / (vh + r.height));
      el.style.setProperty('--p', p.toFixed(4));
    });
  };
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
}

/* ---------- Page state ---------- */

export function initScrollState() {
  let queued = false;
  const update = () => {
    queued = false;
    document.body.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

export function initMotion() {
  document.documentElement.classList.add('js');
  initScrollState();
  revealAll();
  initTilt();
  initSpotlight();
  initScrollProgress();
}
