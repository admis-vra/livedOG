function toggleNav() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Auto-inject backdrop if not present
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.className = 'sidebar-backdrop';
    backdrop.addEventListener('click', toggleNav);
    document.body.appendChild(backdrop);
  }

  const shouldOpen = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', shouldOpen);
  document.body.classList.toggle('sidebar-open', shouldOpen);

  const toggleBtns = document.querySelectorAll('.mobile-nav-toggle');
  toggleBtns.forEach((btn) => {
    btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    const label = btn.querySelector('.nav-toggle-text');
    if (label) {
      label.textContent = shouldOpen ? 'Close' : 'Menu';
    }
  });
}

function handleSubmit(e) {
  e.preventDefault();

  const btn = e.target.querySelector('.form-submit');
  if (!btn) return;

  const previousLabel = btn.textContent;
  btn.textContent = 'message sent';
  btn.style.background = 'linear-gradient(135deg, rgba(62, 240, 198, 0.26), rgba(143, 247, 255, 0.14))';

  window.setTimeout(() => {
    btn.textContent = previousLabel;
    btn.style.background = '';
    e.target.reset();
  }, 2200);
}

function injectAmbientLayers() {
  if (document.querySelector('.fx-layer--lights')) return;

  const lights = document.createElement('div');
  lights.className = 'fx-layer fx-layer--lights';

  const grid = document.createElement('div');
  grid.className = 'fx-layer fx-layer--grid';

  const orbs = document.createElement('div');
  orbs.className = 'fx-layer fx-layer--orbs';
  orbs.innerHTML = `
    <span class="fx-orb fx-orb--a"></span>
    <span class="fx-orb fx-orb--b"></span>
    <span class="fx-orb fx-orb--c"></span>
  `;

  const spotlight = document.createElement('div');
  spotlight.className = 'mouse-spotlight';

  document.body.prepend(grid);
  document.body.prepend(lights);
  document.body.appendChild(orbs);
  document.body.appendChild(spotlight);
}

function applyRevealMotion() {
  const selectors = [
    'section',
    '.hero-layout > *',
    '.sec-header',
    '.featured-summary',
    '.project-card',
    '.project-featured',
    '.about-card',
    '.skill-card',
    '.writing-item',
    '.contact-info',
    '.contact-form',
    '.detail-panel',
    '.nano-card',
    '.nanolog-entry',
    '.social-link',
    '.proof-card',
    '.polaroid'
  ];

  const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
  nodes.forEach((node, index) => {
    node.classList.add('reveal');
    node.style.setProperty('--reveal-delay', `${Math.min(index * 55, 440)}ms`);
  });

  if (typeof IntersectionObserver === 'undefined') {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer =
    window.__revealObserver ||
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

  window.__revealObserver = observer;

  nodes.forEach((node) => observer.observe(node));
}

function applyTiltMotion() {
  const targets = document.querySelectorAll(
    '.project-card, .project-featured, .about-card, .skill-card, .writing-item, .contact-info, .contact-form, .detail-panel, .proof-card, .polaroid, .social-link, .nano-card'
  );

  targets.forEach((target) => {
    target.addEventListener('pointermove', (event) => {
      const rect = target.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 8;
      const rotateX = (0.5 - py) * 8;
      target.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
      target.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
      target.style.transform = `translateY(-6px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    target.addEventListener('pointerleave', () => {
      target.style.transform = '';
      target.style.removeProperty('--tilt-x');
      target.style.removeProperty('--tilt-y');
    });
  });
}

function syncPointerSpotlight() {
  const update = (event) => {
    document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
  };

  window.addEventListener('pointermove', update, { passive: true });
}

function setupSidebarBehavior() {
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  const toggle = document.querySelector('.mobile-nav-toggle');

  const closeSidebar = () => {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    body.classList.remove('sidebar-open');
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      if (!sidebar) return;
      const shouldOpen = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', shouldOpen);
      body.classList.toggle('sidebar-open', shouldOpen);
    });
  }

  document.addEventListener('click', (event) => {
    if (!sidebar || window.innerWidth > 1100) return;
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(event.target) || (toggle && toggle.contains(event.target))) return;
    closeSidebar();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebar();
  });
}

function setupScrollState() {
  const body = document.body;
  let ticking = false;

  const update = () => {
    body.classList.toggle('is-scrolled', window.scrollY > 10);
    ticking = false;
  };

  update();
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

function setupActiveNav() {
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const isSinglePage = body.classList.contains('single-page');
  const currentPage = window.location.pathname.split('/').pop() || 'livedog-portfolio.html';
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  
  if (!isSinglePage) {
    // For non-single pages, just highlight the correct link
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href === currentPage || (href === 'livedog-portfolio.html' && currentPage === 'index.html')) {
        link.classList.add('active');
      }
    });
    return;
  }

  // SPA Behavior for single-page
  const sections = navLinks
    .map((link) => {
      const href = link.getAttribute('href');
      if (!href) return null;
      // Handle both pure hashes "#about" and page hashes "livedog-portfolio.html#about"
      let hash = '';
      if (href.startsWith('#')) hash = href;
      else if (href.includes('#')) hash = href.substring(href.indexOf('#'));
      else if (href === 'livedog-portfolio.html' || href === 'index.html') hash = '#hero';
      
      if (!hash) return null;
      const section = document.querySelector(hash);
      return section ? { link, section, hash } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const showSection = (targetHash) => {
    let active = sections.find(s => s.hash === targetHash) || sections[0];
    
    // Update links
    navLinks.forEach(link => link.classList.remove('active'));
    active.link.classList.add('active');

    // Update sections
    document.querySelectorAll('.main section').forEach(sec => sec.classList.remove('active-section'));
    active.section.classList.add('active-section');
    
    // Close mobile sidebar if open
    if (sidebar) {
      sidebar.classList.remove('open');
      body.classList.remove('sidebar-open');
    }
  };

  // Click events
  sections.forEach((entry) => {
    entry.link.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState(null, null, entry.hash);
      showSection(entry.hash);
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    });
  });

  // Handle initial load based on URL hash
  const initialHash = window.location.hash || '#hero';
  showSection(initialHash);
}
function setupAgeWidget() {
  const ageElement = document.getElementById('current-age');
  if (!ageElement) return;

  const birthdateValue = ageElement.dataset.birthdate;
  const birthdate = birthdateValue ? new Date(birthdateValue) : null;

  const calculateAge = (from, to) => {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();

    if (days < 0) {
      const previousMonth = new Date(to.getFullYear(), to.getMonth(), 0);
      days += previousMonth.getDate();
      months -= 1;
    }
    if (months < 0) {
      months += 12;
      years -= 1;
    }

    return { years, months, days };
  };

  const formatAge = ({ years, months, days }) => {
    const parts = [];
    if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
    if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' ') : '0 days';
  };

  const updateAge = () => {
    if (!birthdate || Number.isNaN(birthdate.getTime())) {
      ageElement.textContent = 'unknown age';
      return;
    }
    const age = calculateAge(birthdate, new Date());
    ageElement.textContent = formatAge(age);
  };

  updateAge();

  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  window.setTimeout(() => {
    updateAge();
    window.setInterval(updateAge, 24 * 60 * 60 * 1000);
  }, nextMidnight - now);
}

function initializeMotion() {
  injectAmbientLayers();
  syncPointerSpotlight();
  setupScrollState();
  setupSidebarBehavior();
  setupActiveNav();
  setupAgeWidget();
  applyRevealMotion();
  applyTiltMotion();
}

window.toggleNav = toggleNav;
window.handleSubmit = handleSubmit;
window.initializeMotion = initializeMotion;
window.decorateMotion = applyRevealMotion;

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('app-ready');
  initializeMotion();
});

// Welcome Overlay: livedOG <-> GODEVIL name reveal
// The alias is typed out, then its letters physically swap positions to show
// that GODEVIL is livedOG read backwards. Built from the existing .welcome-title,
// so every page that has the overlay gets the animation.
const NAME_ALIAS = 'livedOG';
const NAME_CAPTIONS = {
  alias: { main: 'lived + OG', sub: 'lived it. stayed original.' },
  real: { main: 'GO + DEVIL', sub: 'the real name, read backwards.' }
};

function startNameReveal(overlay) {
  const title = overlay.querySelector('.welcome-title');
  if (!title) return () => {};

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  title.textContent = '';
  title.classList.add('name-reveal');
  title.setAttribute('aria-label', `${NAME_ALIAS}, read backwards: GODEVIL`);

  const letters = NAME_ALIAS.split('').map((ch, i, all) => {
    const span = document.createElement('span');
    span.className = 'reveal-letter';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch;
    span.dataset.alias = ch;
    span.dataset.real = ch.toUpperCase();
    span.style.setProperty('--t', String(i / (all.length - 1)));
    title.appendChild(span);
    return span;
  });

  const caption = document.createElement('p');
  caption.className = 'welcome-caption';
  caption.setAttribute('aria-hidden', 'true');
  caption.innerHTML = '<span class="caption-main"></span><span class="caption-sub"></span>';
  title.after(caption);

  const setCaption = ({ main, sub }) => {
    caption.classList.remove('visible');
    later(() => {
      caption.querySelector('.caption-main').textContent = main;
      caption.querySelector('.caption-sub').textContent = sub;
      caption.classList.add('visible');
    }, 220);
  };

  if (reduceMotion) {
    letters.forEach((l) => l.classList.add('typed'));
    caption.querySelector('.caption-main').textContent = 'livedOG ⇄ GODEVIL';
    caption.querySelector('.caption-sub').textContent = 'same letters, read backwards.';
    caption.classList.add('visible');
    return () => {};
  }

  // FLIP: record positions, reverse the DOM order, then animate each letter
  // from where it was to where it now is, arcing over/under its neighbours.
  const flip = (toReal) => {
    // Measure before cancelling so a letter still in flight continues from where it is
    const first = new Map(letters.map((l) => [l, l.getBoundingClientRect().left]));
    letters.forEach((l) => l.getAnimations().forEach((a) => a.cancel()));
    letters.forEach((l) => { l.textContent = toReal ? l.dataset.real : l.dataset.alias; });
    [...title.children].reverse().forEach((el) => title.appendChild(el));
    title.classList.toggle('is-real', toReal);

    const lift = title.getBoundingClientRect().height * 0.42;
    letters.forEach((l, i) => {
      const dx = first.get(l) - l.getBoundingClientRect().left;
      const dy = Math.sign(dx) * lift;
      l.animate([
        { transform: `translate(${dx}px, 0)` },
        { transform: `translate(${dx / 2}px, ${-dy}px) scale(0.85)`, offset: 0.5 },
        { transform: 'translate(0, 0)' }
      ], { duration: 950, delay: i * 30, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
    });
    later(() => setCaption(toReal ? NAME_CAPTIONS.real : NAME_CAPTIONS.alias), 500);
  };

  // 1. type the alias like a terminal
  const caret = document.createElement('span');
  caret.className = 'reveal-caret';
  caret.setAttribute('aria-hidden', 'true');
  title.appendChild(caret);
  letters.forEach((l, i) => later(() => l.classList.add('typed'), 300 + i * 120));
  const typedAt = 300 + letters.length * 120;

  // 2. explain the alias, 3. swap into the real name, then keep alternating
  later(() => setCaption(NAME_CAPTIONS.alias), typedAt + 150);
  let showingReal = false;
  const cycle = () => {
    // Background tabs freeze animations but not timers; don't queue flips there
    if (!document.hidden) {
      showingReal = !showingReal;
      flip(showingReal);
    }
    later(cycle, 3200);
  };
  later(() => { caret.remove(); cycle(); }, typedAt + 1900);

  return () => timers.forEach(clearTimeout);
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('welcome-overlay');
  if (overlay) {
    document.body.style.overflow = 'hidden';
    const stopNameReveal = startNameReveal(overlay);
    const hideOverlay = () => {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
      setTimeout(() => { stopNameReveal(); overlay.remove(); }, 800);
      document.removeEventListener('click', hideOverlay);
      document.removeEventListener('touchstart', hideOverlay);
    };
    document.addEventListener('click', hideOverlay);
    document.addEventListener('touchstart', hideOverlay);
  }
});

function init3DCard() {
    const container = document.querySelector(".polaroid-flip-container");
    const flipper = document.querySelector(".polaroid-flipper");
    if (!container || !flipper) return;

    // Track 3D rotation state (in degrees)
    let rotX = 6;
    let rotY = -10;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startRotX = rotX;
    let startRotY = rotY;
    let moved = false;
    let velX = 0;
    let velY = 0;
    let lastX = 0;
    let lastY = 0;
    let animFrame = null;

    const applyTransform = () => {
        flipper.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    };

    applyTransform();

    const onPointerDown = (e) => {
        // Left click or touch
        if (e.button !== undefined && e.button !== 0) return;
        isDragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        lastX = e.clientX;
        lastY = e.clientY;
        startRotX = rotX;
        startRotY = rotY;
        velX = 0;
        velY = 0;
        flipper.style.transition = "none";
        container.style.cursor = "grabbing";
        if (animFrame) cancelAnimationFrame(animFrame);
        if (container.setPointerCapture) {
            container.setPointerCapture(e.pointerId);
        }
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            moved = true;
        }

        // Instant velocity tracking for smooth release
        velY = (e.clientX - lastX) * 0.45;
        velX = -(e.clientY - lastY) * 0.45;
        lastX = e.clientX;
        lastY = e.clientY;

        // Freely rotate around X and Y axes
        rotY = startRotY + dx * 0.55;
        rotX = startRotX - dy * 0.55;

        // Clamp tilt so it stays comfortably visible while fully rotatable
        rotX = Math.max(-65, Math.min(65, rotX));

        applyTransform();
    };

    const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        container.style.cursor = "grab";
        if (container.releasePointerCapture && e.pointerId) {
            try { container.releasePointerCapture(e.pointerId); } catch(err) {}
        }

        // If user just tapped/clicked without dragging, smoothly flip 180 degrees
        if (!moved) {
            flipper.style.transition = "transform 0.8s cubic-bezier(0.2, 0.9, 0.3, 1)";
            rotY += 180;
            applyTransform();
            return;
        }

        // Apply momentum coasting and STAY at the hand-rotated angle
        const coast = () => {
            if (Math.abs(velX) < 0.05 && Math.abs(velY) < 0.05) {
                velX = 0;
                velY = 0;
                return;
            }
            rotY += velY;
            rotX += velX;
            rotX = Math.max(-65, Math.min(65, rotX));
            velX *= 0.90; // friction
            velY *= 0.90; // friction
            applyTransform();
            animFrame = requestAnimationFrame(coast);
        };
        animFrame = requestAnimationFrame(coast);
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
}

const originalInit = window.initializeMotion;
window.initializeMotion = function() {
    if (originalInit) originalInit();
    init3DCard();
    initSpotifyWidget();
    initAgeCounter();
};





// Initialize Firebase globally
const firebaseConfig = {
  apiKey: "AIzaSyArzjpVRqcCVJfv8jelihYJel2HywiU2kU",
  authDomain: "siro-port.firebaseapp.com",
  projectId: "siro-port",
  storageBucket: "siro-port.firebasestorage.app",
  messagingSenderId: "790686461505",
  appId: "1:790686461505:web:8614320d394940c2bbe0c0",
  measurementId: "G-E0GVCHR1LM",
  databaseURL: "https://siro-port-default-rtdb.firebaseio.com"
};

let db = null;
let auth = null;
let currentUser = null;

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    
    // Auth initialization
    if (firebase.auth) {
        auth = firebase.auth();
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) console.log("Admin authenticated!");
        });
    }
}

// Hidden Admin Login Trigger
document.addEventListener("DOMContentLoaded", () => {
    const avatar = document.querySelector('.sidebar-avatar');
    if (avatar && auth) {
        let clickCount = 0;
        let clickTimer;
        
        avatar.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            
            if (clickCount >= 5) {
                clickCount = 0;
                if (currentUser) {
                    if (confirm("Admin is currently logged in. Do you want to log out?")) {
                        auth.signOut().then(() => alert("Logged out successfully."));
                    }
                } else {
                    const email = prompt("Admin Email:");
                    if (email) {
                        const password = prompt("Admin Password:");
                        if (password) {
                            auth.signInWithEmailAndPassword(email, password)
                                .then(() => alert("Admin access granted! Database writes enabled."))
                                .catch(err => alert("Login failed: " + err.message));
                        }
                    }
                }
            }
            clickTimer = setTimeout(() => { clickCount = 0; }, 2000); // Reset clicks after 2 seconds
        });
    }
});

// Spotify Lanyard Integration
function initSpotifyWidget() {
    const DISCORD_ID = "943169973067599933"; // Replace with actual ID later
    const widget = document.getElementById("spotify-widget");
    const link = document.getElementById("spotify-link");
    const cover = document.getElementById("spotify-cover");
    const title = document.getElementById("spotify-title");
    const artist = document.getElementById("spotify-artist");
    const icon = document.querySelector(".spotify-icon");
    
    if (!widget || DISCORD_ID === "YOUR_DISCORD_ID") return;

    function renderSpotify(spotifyData) {
        widget.classList.add("active");
        title.textContent = spotifyData.song;
        artist.textContent = spotifyData.artist.replace(/;/g, ", ");
        cover.src = spotifyData.album_art_url;
        link.href = `https://open.spotify.com/track/${spotifyData.track_id}`;
    }

    let ws = new WebSocket("wss://api.lanyard.rest/socket");

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.op === 1) {
            setInterval(() => {
                ws.send(JSON.stringify({ op: 3 }));
            }, data.d.heartbeat_interval);

            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_ID }
            }));
        }

        if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
            const spotify = data.d.spotify;
            
            if (spotify) {
                // Currently playing - update UI and cache to Firebase
                localStorage.setItem('last_spotify_song', JSON.stringify(spotify));
                // Only push to Firebase if logged in as Admin!
                if (db && currentUser) {
                    db.ref('last_spotify_song').set(spotify).catch(e => console.error("Firebase error:", e));
                }
                renderSpotify(spotify);
            } else {
                // Not playing - load from Firebase first, then localStorage fallback
                if (db) {
                    db.ref('last_spotify_song').once('value').then(snapshot => {
                        const val = snapshot.val();
                        if (val) {
                            renderSpotify(val);
                        } else {
                            fallbackLocal();
                        }
                    }).catch(e => fallbackLocal());
                } else {
                    fallbackLocal();
                }
                
                function fallbackLocal() {
                    const cached = localStorage.getItem('last_spotify_song');
                    if (cached) {
                        try {
                            renderSpotify(JSON.parse(cached));
                        } catch (e) {
                            widget.classList.remove("active");
                        }
                    } else {
                        widget.classList.remove("active");
                    }
                }
            }
        }
    };
    
    ws.onclose = () => {
        setTimeout(initSpotifyWidget, 5000);
    };
}

// Scroll animations
document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.fade-in-section').forEach(el => {
        observer.observe(el);
    });
});

// Real-time Age Counter
function initAgeCounter() {
    const ageElement = document.getElementById("realtime-age");
    if (!ageElement) return;

    // Birth date: 25 Sept 2007 00:01 AM
    const birthDate = new Date("2007-09-25T00:01:00");

    setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - birthDate.getTime();
        
        let y = now.getFullYear() - birthDate.getFullYear();
        let m = now.getMonth() - birthDate.getMonth();
        let d = now.getDate() - birthDate.getDate();
        
        if (d < 0) {
            m--;
            let tempDate = new Date(now.getFullYear(), now.getMonth(), 0);
            d += tempDate.getDate();
        }
        if (m < 0) {
            y--;
            m += 12;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const sec = totalSeconds % 60;
        const min = Math.floor(totalSeconds / 60) % 60;
        const hr = Math.floor(totalSeconds / 3600) % 24;
        
        ageElement.innerHTML = `${y}<span>YRS</span> ${m}<span>MOS</span> ${d}<span>D</span> ${hr.toString().padStart(2, '0')}<span>H</span> ${min.toString().padStart(2, '0')}<span>M</span> ${sec.toString().padStart(2, '0')}<span>S</span>`;
    }, 1000);
}

// Death Note Kira Audio & Censor Reveal Effect
document.addEventListener('DOMContentLoaded', () => {
    const censorBlock = document.getElementById('kira-censor');
    const audio = document.getElementById('kira-audio');
    
    const triggerKira = () => {
        if (censorBlock) censorBlock.classList.toggle('is-revealed');
        if (audio && audio.paused) {
            audio.volume = 0.6;
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play prevented:', e));
        }
    };

    if (censorBlock) {
        censorBlock.addEventListener('mouseenter', triggerKira);
        censorBlock.addEventListener('click', triggerKira);
    }

    // Allow any censor block to reveal on tap/click
    document.querySelectorAll('.censor-block').forEach(block => {
        if (block !== censorBlock) {
            block.addEventListener('click', () => block.classList.toggle('is-revealed'));
        }
    });
});


