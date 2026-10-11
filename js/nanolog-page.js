/**
 * Auto-fetching Markdown Nanolog Engine for livedOG Portfolio
 * Automatically fetches and renders .md blogs from:
 * 1. GitHub repository (e.g. admis-vra/MyNanoLife)
 * 2. Local folder /api/mynanolife when running locally
 * 3. Local fallback window.NANOLOG_DATA
 */

const NANOLOG_CONFIG = {
  github: {
    owner: 'admis-vra',
    repo: 'MyNanoLife', // Name of your GitHub repo
    folder: '', // Folder inside repo ('' for root, or 'MyNanoLife')
    branch: 'main',
  },
  localEndpoint: '/api/mynanolife',
  cacheMinutes: 5,
};

function getActiveConfig() {
  return {
    owner: localStorage.getItem('nanolog_gh_owner') || NANOLOG_CONFIG.github.owner,
    repo: localStorage.getItem('nanolog_gh_repo') || NANOLOG_CONFIG.github.repo,
    folder: localStorage.getItem('nanolog_gh_folder') !== null ? localStorage.getItem('nanolog_gh_folder') : NANOLOG_CONFIG.github.folder,
    branch: localStorage.getItem('nanolog_gh_branch') || NANOLOG_CONFIG.github.branch,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format date string or timestamp into readable IST label:
 * e.g. "12 June 2026, 16:20 (IST)"
 */
function formatDateLabel(rawDate) {
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) {
    return String(rawDate);
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = months[parsed.getMonth()];
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes} (IST)`;
}

/**
 * Convert Markdown text into clean HTML matching screenshot
 */
function markdownToHtml(md) {
  if (!md) return '';

  let html = md;

  // Code blocks: ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, (match, code) => `<code class="inline-code">${escapeHtml(code)}</code>`);

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="nanolog-image" loading="lazy"/>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="nanolog-link">$1</a>');

  // Blockquotes: > text
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="nanolog-quote">$1</blockquote>');

  // Unordered lists: - item or * item
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(\n|$))+/g, '<ul class="nanolog-list">$&</ul>');

  // Paragraphs: separate double newlines
  const blocks = html.split(/\n{2,}/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (/^<(pre|ul|blockquote|h[1-6]|img)/i.test(trimmed)) {
      return trimmed;
    }
    return `<p class="nanolog-entry-body">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}

/**
 * Parse Markdown file with optional YAML frontmatter
 */
function parseMarkdownPost(rawText, filename, fallbackMtime) {
  let title = '';
  let date = '';
  let image = '';
  let body = rawText;

  // Check for YAML frontmatter between --- and ---
  const frontmatterMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    body = frontmatterMatch[2].trim();

    frontmatter.split(/\r?\n/).forEach(line => {
      const parts = line.split(':');
      if (parts.length < 2) return;
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();

      if (key === 'title') {
        title = val.replace(/^["']|["']$/g, '');
      } else if (key === 'date') {
        date = val.replace(/^["']|["']$/g, '');
      } else if (key === 'image') {
        image = val.replace(/^["']|["']$/g, '');
      }
    });
  }

  // If heading # is in body, use as title
  if (!title) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
      body = body.replace(/^#\s+(.+)$/m, '').trim();
    }
  }

  // Date fallback
  if (!date) {
    const fnDateMatch = filename ? filename.match(/^(\d{4}-\d{2}-\d{2})/) : null;
    if (fnDateMatch) {
      date = fnDateMatch[1];
    } else if (fallbackMtime) {
      date = new Date(fallbackMtime * 1000).toISOString();
    } else {
      date = new Date().toISOString();
    }
  }

  return {
    id: filename || String(Date.now()),
    title: title || '',
    dateLabel: formatDateLabel(date),
    timestamp: new Date(date).getTime() || (fallbackMtime ? fallbackMtime * 1000 : Date.now()),
    bodyHtml: markdownToHtml(body),
    image: image
  };
}

/**
 * Fetch from local API if available
 */
async function fetchLocalPosts() {
  try {
    const res = await fetch(NANOLOG_CONFIG.localEndpoint, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.posts)) return null;

    return data.posts.map(p => parseMarkdownPost(p.content, p.name, p.mtime));
  } catch (err) {
    return null;
  }
}

/**
 * Fetch from GitHub API
 */
async function fetchGitHubPosts() {
  const cfg = getActiveConfig();
  const folderPath = cfg.folder ? `/${encodeURIComponent(cfg.folder)}` : '';
  const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents${folderPath}?ref=${encodeURIComponent(cfg.branch)}`;

  try {
    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!res.ok) return null;

    const files = await res.json();
    if (!Array.isArray(files)) return [];

    const mdFiles = files.filter(f => f.type === 'file' && /\.(md|markdown)$/i.test(f.name));

    const postPromises = mdFiles.map(async (file) => {
      try {
        const rawRes = await fetch(file.download_url);
        if (!rawRes.ok) return null;
        const text = await rawRes.text();
        return parseMarkdownPost(text, file.name, null);
      } catch (e) {
        return null;
      }
    });

    return (await Promise.all(postPromises)).filter(Boolean);
  } catch (err) {
    return null;
  }
}

/**
 * Main Controller: Fetch and render timeline cleanly with zero unwanted banners or tags
 */
async function loadAndRenderTimeline(forceRefresh = false) {
  const mount = document.getElementById('nanologTimeline');
  if (!mount) return;

  // Ensure any previous sync bar element is removed
  const existingBar = document.getElementById('nanolog-sync-bar');
  if (existingBar) existingBar.remove();

  const CACHE_KEY = 'NANOLOG_CACHE_CLEAN';
  const CACHE_TIME_KEY = 'NANOLOG_CACHE_TIME_CLEAN';

  // Step 1: Render from cache immediately if present (0ms delay)
  let cachedData = null;
  const rawCache = localStorage.getItem(CACHE_KEY);
  const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();

  if (rawCache && !forceRefresh) {
    try {
      cachedData = JSON.parse(rawCache);
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        renderArticles(mount, cachedData);
      }
    } catch (e) {}
  }

  const cacheAgeMinutes = cacheTime ? (now - Number(cacheTime)) / (1000 * 60) : 999;
  if (cachedData && cacheAgeMinutes < NANOLOG_CONFIG.cacheMinutes && !forceRefresh) {
    return;
  }

  // Step 2: Try local folder /api/mynanolife if running on localhost
  let freshPosts = null;
  const isLocalHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isLocalHost) {
    const localPosts = await fetchLocalPosts();
    if (localPosts && localPosts.length > 0) {
      freshPosts = localPosts;
    }
  }

  // Step 3: Fetch from GitHub
  if (!freshPosts) {
    const ghPosts = await fetchGitHubPosts();
    if (ghPosts && ghPosts.length > 0) {
      freshPosts = ghPosts;
    }
  }

  // Step 4: Fallback to static window.NANOLOG_DATA if available
  let combinedPosts = [];
  if (freshPosts && freshPosts.length > 0) {
    combinedPosts = [...freshPosts];
  }

  if (Array.isArray(window.NANOLOG_DATA)) {
    window.NANOLOG_DATA.forEach(staticEntry => {
      const exists = combinedPosts.some(p => (p.dateLabel || '') === (staticEntry.dateLabel || ''));
      if (!exists) {
        combinedPosts.push({
          id: staticEntry.id || String(Date.now()),
          title: staticEntry.title || '',
          dateLabel: staticEntry.dateLabel || '',
          timestamp: new Date(staticEntry.dateLabel || 0).getTime() || 0,
          bodyHtml: `<p class="nanolog-entry-body">${escapeHtml(staticEntry.body || '')}</p>`,
          image: staticEntry.image || ''
        });
      }
    });
  }

  // Step 5: Sort posts by timestamp descending (newest first)
  combinedPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (combinedPosts.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(combinedPosts));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    renderArticles(mount, combinedPosts);
  }
}

/**
 * Render articles matching exact screenshot UI:
 * Pink rail, circular node pin, underlined date, rounded dark card with pure body and image.
 * No tags, no random labels.
 */
function renderArticles(mount, posts) {
  if (!posts || !posts.length) {
    mount.innerHTML = `
      <div class="nanolog-empty">
        <p>No nanolog entries found. Add a <code>.md</code> file to your <code>MyNanoLife</code> GitHub folder to get started!</p>
      </div>
    `;
    return;
  }

  mount.innerHTML = posts.map((entry) => {
    const image = entry.image
      ? `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title || 'Nanolog photo')}" class="nanolog-image" loading="lazy"/>`
      : '';

    return `
      <article class="nanolog-entry">
        <div class="nanolog-date">${escapeHtml(entry.dateLabel || '')}</div>
        <div class="nanolog-card">
          ${entry.title ? `<h3 class="nanolog-entry-title">${escapeHtml(entry.title)}</h3>` : ''}
          ${entry.bodyHtml || `<p class="nanolog-entry-body">${escapeHtml(entry.body || '')}</p>`}
          ${image}
        </div>
      </article>
    `;
  }).join('');

  if (typeof window.decorateMotion === 'function') {
    window.decorateMotion();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Clear any old cache containing tags
  localStorage.removeItem('NANOLOG_CACHE');
  loadAndRenderTimeline(false);
});
