// Small personal interactions carried over from the original site, rebuilt to be
// keyboard-accessible: the live "active since" counter, the Kira reveal, the free-rotating
// polaroid, and copy-to-clipboard for the Discord handle.

import { reducedMotion } from './motion.js';

export function initActiveSince() {
  const el = document.getElementById('active-since');
  if (!el) return;
  const born = new Date('2007-09-25T00:01:00');
  const pad = (n) => String(n).padStart(2, '0');

  const tick = () => {
    const now = new Date();
    let y = now.getFullYear() - born.getFullYear();
    let m = now.getMonth() - born.getMonth();
    let d = now.getDate() - born.getDate();
    if (d < 0) {
      m--;
      d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    const s = Math.floor((now - born) / 1000);
    el.innerHTML =
      `${y}<i>y</i> ${m}<i>m</i> ${d}<i>d</i> ` +
      `${pad(Math.floor(s / 3600) % 24)}<i>h</i> ${pad(Math.floor(s / 60) % 60)}<i>m</i> ${pad(s % 60)}<i>s</i>`;
  };

  // Only tick while the counter is on screen
  let timer = 0;
  tick();
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) {
      tick();
      timer = setInterval(tick, 1000);
    }
  }).observe(el);
}

export function initKira() {
  const block = document.getElementById('kira');
  const audio = document.getElementById('kira-audio');
  if (!block) return;
  block.addEventListener('click', () => {
    const revealed = block.getAttribute('aria-pressed') !== 'true';
    block.setAttribute('aria-pressed', String(revealed));
    if (revealed && audio) {
      audio.volume = 0.6;
      audio.currentTime = 0;
      audio.play().catch(() => { /* autoplay rules: the reveal still works silently */ });
    }
  });
}

// Free-rotating 3D polaroid. Rotation is kept as a matrix and every drag is applied in
// screen space (a "trackball"), so the card always turns the way the pointer moves, even
// when it is already upside down. Flicks keep spinning with momentum.
export function initPolaroid() {
  const card = document.getElementById('polaroid');
  if (!card || !window.DOMMatrix) return;

  const still = reducedMotion.matches;
  const DEG_PER_PX = 0.45;
  const FRICTION = 0.996; // per ms: about 6% speed lost per 60fps frame
  let m = new DOMMatrix('rotateX(-6deg) rotateY(14deg)');
  let raf = 0;
  let touched = false;
  let visible = false;
  // Momentum as an axis plus an angular speed (deg/ms), both in screen space
  let axis = [0, 1];
  let speed = 0;

  const apply = (extra = '') => { card.style.transform = m.toString() + extra; };
  // Pre-multiplying applies the turn relative to the screen, not the card's own axes
  const turn = (ax, ay, deg) => {
    if (!deg) return;
    m = new DOMMatrix().rotateAxisAngle(ax, ay, 0, deg).multiply(m);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  apply();

  // Ambient: a gentle sway invites interaction, until the first touch, and only on screen
  const sway = (t) => {
    if (touched || !visible) { raf = 0; return; }
    apply(` rotateX(${(Math.sin(t / 1500) * 7).toFixed(2)}deg) rotateY(${(Math.sin(t / 2100) * 16).toFixed(2)}deg)`);
    raf = requestAnimationFrame(sway);
  };
  if (!still) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !touched && !raf) raf = requestAnimationFrame(sway);
    }).observe(card);
  }

  const coast = () => {
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(48, now - last);
      last = now;
      turn(axis[0], axis[1], speed * dt);
      apply();
      speed *= Math.pow(FRICTION, dt);
      raf = Math.abs(speed) > 0.004 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  };

  // Take over from whatever is on screen (sway or coasting) without a visual jump
  const grab = () => {
    stop();
    if (!touched) {
      touched = true;
      const current = getComputedStyle(card).transform;
      if (current && current !== 'none') m = new DOMMatrix(current);
    }
  };

  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let dragging = false;

  card.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    grab();
    dragging = true;
    speed = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = performance.now();
    card.setPointerCapture(e.pointerId);
    card.classList.add('is-dragging');
  });

  card.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    const dist = Math.hypot(dx, dy);
    if (dist) {
      // Rotate about the axis perpendicular to the drag direction
      const ax = -dy / dist;
      const ay = dx / dist;
      turn(ax, ay, dist * DEG_PER_PX);
      apply();
      // Smoothed release velocity so a flick carries on in the same direction
      const v = (dist * DEG_PER_PX) / dt;
      axis = [ax, ay];
      speed = speed * 0.6 + v * 0.4;
    }
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('is-dragging');
    // Holding still before letting go means "put it down here", not "throw it"
    if (performance.now() - lastT > 90) speed = 0;
    if (!still && speed > 0.01) coast();
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);
  card.addEventListener('lostpointercapture', release);

  // Keyboard: arrows turn 20°, Enter/Space flips 180°, eased over a short tween
  const tween = (ax, ay, deg) => {
    grab();
    if (still) {
      turn(ax, ay, deg);
      apply();
      return;
    }
    const start = performance.now();
    const duration = 550;
    let done = 0;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      turn(ax, ay, deg * eased - done);
      done = deg * eased;
      apply();
      raf = p < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  };

  card.addEventListener('keydown', (e) => {
    const moves = {
      ArrowLeft: [0, 1, -20],
      ArrowRight: [0, 1, 20],
      ArrowUp: [1, 0, 20],
      ArrowDown: [1, 0, -20],
      Enter: [0, 1, 180],
      ' ': [0, 1, 180]
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    tween(...move);
  });
}

export function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const status = btn.querySelector('.copy-status');
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        if (status) status.textContent = 'copied';
      } catch {
        // Clipboard can be blocked (http, permissions): say so honestly instead of pretending
        if (status) status.textContent = `copy failed: ${value}`;
      }
      btn.classList.add('is-copied');
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => {
        btn.classList.remove('is-copied');
        if (status) status.textContent = '';
      }, 2400);
    });
  });
}

// Full-size image viewer built on <dialog>: the browser handles focus trapping and Escape
export function initLightbox() {
  // A product shot whose image is missing shows a designed placeholder instead of a broken image
  document.querySelectorAll('.shot img').forEach((img) => {
    const markMissing = () => img.closest('.shot')?.classList.add('is-missing');
    img.addEventListener('error', markMissing, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') markMissing();
  });

  document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
    const dialog = document.getElementById(trigger.dataset.lightbox);
    if (!dialog?.showModal) return;
    trigger.addEventListener('click', () => {
      if (trigger.classList.contains('is-missing')) return;
      // The image inside is lazy; load it now so it is ready as the dialog opens
      dialog.querySelector('img')?.setAttribute('loading', 'eager');
      dialog.showModal();
    });
    // Clicking the dark backdrop (the dialog itself, not its content) closes it
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
}

export function initExtras() {
  initActiveSince();
  initKira();
  initPolaroid();
  initCopyButtons();
  initLightbox();
}
