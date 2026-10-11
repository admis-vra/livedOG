// Floating navigation: scroll-spy with a sliding indicator, plus an accessible mobile menu.

export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  initScrollSpy(nav);
  initMenu(nav);
}

function initScrollSpy(nav) {
  const links = [...document.querySelectorAll('.nav__link, .menu__link')];
  const indicator = nav.querySelector('.nav__indicator');
  const bar = nav.querySelector('.nav__links');
  const ids = [...new Set(links.map((l) => l.hash).filter(Boolean))];
  const sections = ids.map((id) => document.querySelector(id)).filter(Boolean);
  if (!sections.length) return;

  const moveIndicator = (active) => {
    if (!indicator || !bar) return;
    if (!active || !active.offsetParent) {
      indicator.style.setProperty('--ind-o', '0');
      return;
    }
    indicator.style.setProperty('--ind-x', `${active.offsetLeft}px`);
    indicator.style.setProperty('--ind-w', `${active.offsetWidth}px`);
    indicator.style.setProperty('--ind-o', '1');
  };

  let current = null;
  const setActive = (id) => {
    if (id === current) return;
    current = id;
    links.forEach((l) => {
      if (l.hash === id) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
    moveIndicator(bar?.querySelector(`.nav__link[href$="${id}"]`));
  };

  // A section is "current" when it crosses a thin band just above the middle of the viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) setActive(`#${e.target.id}`);
    });
    // Above the first tracked section (the hero) nothing is highlighted
    if (window.scrollY < sections[0].offsetTop - window.innerHeight * 0.5) setActive(null);
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));

  window.addEventListener('resize', () => moveIndicator(bar?.querySelector('[aria-current="true"]')), { passive: true });
}

function initMenu(nav) {
  const toggle = nav.querySelector('.nav__toggle');
  const menu = document.getElementById(toggle?.getAttribute('aria-controls') || '');
  if (!toggle || !menu) return;

  const focusables = () => [toggle, ...menu.querySelectorAll('a, button')];
  const label = toggle.querySelector('.nav__toggle-label');

  const setOpen = (open, { restoreFocus = true } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Menu';
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a')?.focus();
    else if (restoreFocus) toggle.focus();
  };

  menu.inert = true;
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  // Navigating closes the menu; focus moves to the target section via the anchor, not back to the toggle
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep focus inside the toggle + menu while it is open
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Closing on resize avoids a stuck, hidden-but-open menu when rotating a tablet
  window.matchMedia('(min-width: 901px)').addEventListener('change', (mq) => {
    if (mq.matches && menu.classList.contains('is-open')) setOpen(false, { restoreFocus: false });
  });
}
