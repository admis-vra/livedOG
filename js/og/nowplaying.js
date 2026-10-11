// Navbar music widget.
// Default: rotates through my playlist, one song per 5 minutes. The song is picked from
// the clock (not from page load), so every visitor sees the same track in the same window
// and it keeps advancing across reloads.
// Live: when Lanyard reports I'm actually listening on Spotify, that track takes over and the
// label switches to "listening now"; when I stop, it falls back to the rotation.

import { PLAYLIST } from './playlist.js';
import { reducedMotion } from './motion.js';

const SLOT_MS = 5 * 60 * 1000;

// Fixed-seed shuffle: a varied order that is identical for every visitor
function shuffled(list, seed = 2007) {
  const a = list.slice();
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ORDER = shuffled(PLAYLIST);
const slotIndex = (t = Date.now()) => Math.floor(t / SLOT_MS) % ORDER.length;

let widget = null;
let live = null;
let current = null;
let timer = 0;

function preload(track) {
  if (track) new Image().src = track.art;
}

function render(track, { isLive = false } = {}) {
  if (!widget || !track) return;
  const key = `${isLive}|${track.title}|${track.artist}`;
  if (key === current) return;
  const first = current === null;
  current = key;

  const apply = () => {
    const img = widget.querySelector('.np__art img');
    img.src = track.art;
    widget.querySelector('.np__title-inner').textContent = track.title;
    widget.querySelector('.np__artist').textContent = track.artist;
    widget.querySelector('.np__status').textContent = isLive ? 'listening now' : 'on my playlist';
    widget.href = track.url;
    widget.classList.toggle('is-live', isLive);
    widget.setAttribute('aria-label',
      `${isLive ? 'Listening now' : 'On my playlist'}: ${track.title} by ${track.artist}. Opens Spotify in a new tab.`);
    widget.hidden = false;
    fitTitle();
  };

  if (first || reducedMotion.matches) {
    apply();
    return;
  }
  // Crossfade: fade out, swap content, fade back in
  widget.classList.add('is-switching');
  setTimeout(() => {
    apply();
    widget.classList.remove('is-switching');
  }, 260);
}

// Long titles scroll gently instead of being cut off (static ellipsis with reduced motion)
function fitTitle() {
  const box = widget.querySelector('.np__title');
  const inner = widget.querySelector('.np__title-inner');
  widget.classList.remove('is-marquee');
  requestAnimationFrame(() => {
    const overflow = inner.scrollWidth - box.clientWidth;
    if (overflow > 4 && !reducedMotion.matches) {
      widget.style.setProperty('--np-shift', `${-overflow - 8}px`);
      widget.classList.add('is-marquee');
    }
  });
}

function showRotation() {
  render(ORDER[slotIndex()]);
  preload(ORDER[(slotIndex() + 1) % ORDER.length]);
}

function scheduleNextSlot() {
  clearTimeout(timer);
  const wait = SLOT_MS - (Date.now() % SLOT_MS) + 50;
  timer = setTimeout(() => {
    if (!live) showRotation();
    scheduleNextSlot();
  }, wait);
}

// Called by services.js with Lanyard data (or null when not listening)
export function setLiveTrack(spotify) {
  if (!widget) return;
  if (spotify) {
    live = {
      title: spotify.song,
      artist: spotify.artist.replace(/;/g, ', '),
      art: spotify.album_art_url,
      url: `https://open.spotify.com/track/${spotify.track_id}`
    };
    render(live, { isLive: true });
  } else {
    live = null;
    showRotation();
  }
}

export function initNowPlaying() {
  widget = document.getElementById('now-playing');
  if (!widget || !ORDER.length) return;
  showRotation();
  scheduleNextSlot();
  // Timers are throttled in background tabs; catch up as soon as the tab is visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !live) showRotation();
  });
}
