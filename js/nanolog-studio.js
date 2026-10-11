function encodeBase64Unicode(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64Unicode(value) {
  return decodeURIComponent(escape(atob(value)));
}

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function loadStudioConfig() {
  return {
    owner: localStorage.getItem('nanologOwner') || '',
    repo: localStorage.getItem('nanologRepo') || '',
    branch: localStorage.getItem('nanologBranch') || 'main',
    token: localStorage.getItem('nanologToken') || ''
  };
}

function saveStudioConfig(config) {
  localStorage.setItem('nanologOwner', config.owner);
  localStorage.setItem('nanologRepo', config.repo);
  localStorage.setItem('nanologBranch', config.branch);
  localStorage.setItem('nanologToken', config.token);
}

function formatDateLabel(value) {
  if (!value) return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }) + ' (IST)';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }) + ' (IST)';
}

function buildNanologFile(entries) {
  return `window.NANOLOG_DATA = ${JSON.stringify(entries, null, 2)};\n`;
}

async function fetchRepoFile(config) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/data/nanolog.js?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    throw new Error('Could not read nanolog file from GitHub.');
  }

  return response.json();
}

async function pushNanologEntry(event) {
  event.preventDefault();

  const status = document.getElementById('studioStatus');
  const form = event.target;
  const config = {
    owner: form.owner.value.trim(),
    repo: form.repo.value.trim(),
    branch: form.branch.value.trim() || 'main',
    token: form.token.value.trim()
  };

  if (!config.owner || !config.repo || !config.token) {
    status.textContent = 'Fill GitHub owner, repo, and token first.';
    return;
  }

  saveStudioConfig(config);
  status.textContent = 'Publishing nanolog to GitHub...';

  try {
    const current = await fetchRepoFile(config);
    const currentText = decodeBase64Unicode(current.content.replace(/\n/g, ''));
    const existing = currentText.replace(/^window\.NANOLOG_DATA\s*=\s*/, '').replace(/;\s*$/, '');
    const entries = JSON.parse(existing);

    const entry = {
      id: toSlug(`${form.date.value || new Date().toISOString()}-${form.title.value}`),
      title: form.title.value.trim(),
      dateLabel: formatDateLabel(form.date.value),
      body: form.body.value.trim(),
      image: form.image.value.trim(),
      tags: form.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean)
    };

    entries.unshift(entry);

    const newFile = buildNanologFile(entries);
    const pushResponse = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/data/nanolog.js`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add nanolog: ${entry.title || entry.dateLabel}`,
        content: encodeBase64Unicode(newFile),
        sha: current.sha,
        branch: config.branch
      })
    });

    if (!pushResponse.ok) {
      throw new Error('GitHub refused the update.');
    }

    form.reset();
    form.branch.value = config.branch;
    form.owner.value = config.owner;
    form.repo.value = config.repo;
    form.token.value = config.token;
    status.textContent = 'Nanolog published. Once your site updates from GitHub, it will appear on the nanolog page.';
  } catch (error) {
    status.textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nanologStudioForm');
  if (!form) return;

  const config = loadStudioConfig();
  form.owner.value = config.owner;
  form.repo.value = config.repo;
  form.branch.value = config.branch;
  form.token.value = config.token;

  form.addEventListener('submit', pushNanologEntry);
});
