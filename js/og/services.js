// Third-party integrations, loaded after the page is idle so they never delay first paint:
//  - Firebase (caches the last Spotify track; hidden admin login on the nav avatar)
//  - Lanyard (live Spotify status from Discord)

import { setLiveTrack } from './nowplaying.js';

const FIREBASE_SDK = [
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'
];

// Firebase web config is public by design; access is controlled by the database rules.
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyArzjpVRqcCVJfv8jelihYJel2HywiU2kU',
  authDomain: 'siro-port.firebaseapp.com',
  projectId: 'siro-port',
  storageBucket: 'siro-port.firebasestorage.app',
  messagingSenderId: '790686461505',
  appId: '1:790686461505:web:8614320d394940c2bbe0c0',
  measurementId: 'G-E0GVCHR1LM',
  databaseURL: 'https://siro-port-default-rtdb.firebaseio.com'
};

const DISCORD_ID = '943169973067599933';
const SPOTIFY_CACHE_KEY = 'last_spotify_song';

let db = null;
let auth = null;
let currentUser = null;

const loadScript = (src) => new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = false; // keep execution order: app before database/auth
  s.onload = resolve;
  s.onerror = reject;
  document.head.appendChild(s);
});

async function initFirebase() {
  try {
    await Promise.all(FIREBASE_SDK.map(loadScript));
  } catch {
    return; // offline or blocked: the site works without it
  }
  const fb = window.firebase;
  if (!fb) return;
  if (!fb.apps.length) fb.initializeApp(FIREBASE_CONFIG);
  db = fb.database();
  if (fb.auth) {
    auth = fb.auth();
    auth.onAuthStateChanged((user) => { currentUser = user; });
  }
  initAdminTrigger();
}

// Five quick clicks on the nav avatar opens the admin login (unchanged from the original site)
function initAdminTrigger() {
  const trigger = document.querySelector('.js-admin-trigger');
  if (!trigger || !auth) return;
  let clicks = 0;
  let timer;
  trigger.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 2000);
    if (clicks < 5) return;
    clicks = 0;
    if (currentUser) {
      if (confirm('Admin is currently logged in. Do you want to log out?')) {
        auth.signOut().then(() => alert('Logged out successfully.'));
      }
      return;
    }
    const email = prompt('Admin Email:');
    if (!email) return;
    const password = prompt('Admin Password:');
    if (!password) return;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => alert('Admin access granted! Database writes enabled.'))
      .catch((err) => alert('Login failed: ' + err.message));
  });
}

/* ---------- Spotify via Lanyard ---------- */

// The navbar widget (nowplaying.js) rotates through my playlist by default; a live track
// from Lanyard takes over while I'm actually listening, and null hands control back.

let heartbeat = null;

function initSpotify() {
  if (!document.getElementById('now-playing')) return;
  let ws;
  try {
    ws = new WebSocket('wss://api.lanyard.rest/socket');
  } catch {
    return; // no live status: the playlist rotation keeps running
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.op === 1) {
      clearInterval(heartbeat);
      heartbeat = setInterval(() => ws.send(JSON.stringify({ op: 3 })), data.d.heartbeat_interval);
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
    }
    if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
      const track = data.d.spotify;
      if (track) {
        localStorage.setItem(SPOTIFY_CACHE_KEY, JSON.stringify(track));
        // Only the logged-in admin may write the shared cache
        if (db && currentUser) db.ref(SPOTIFY_CACHE_KEY).set(track).catch(() => {});
        setLiveTrack(track);
      } else {
        setLiveTrack(null);
      }
    }
  };

  ws.onclose = () => {
    clearInterval(heartbeat);
    setTimeout(initSpotify, 5000);
  };
}

export async function initServices() {
  await initFirebase();
  initSpotify();
}
