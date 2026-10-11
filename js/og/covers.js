// Abstract project covers. There are no real screenshots yet, so each project gets a motif
// drawn from its own description instead of a fake UI: ProblemForge's "chaos into structure"
// and HabitX's streaks. The covers are decorative (aria-hidden in the markup).

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function buildForge(el) {
  const rand = seeded(11);
  const grid = document.createElement('div');
  grid.className = 'forge-grid';
  for (let i = 0; i < 35; i++) {
    const cell = document.createElement('span');
    cell.className = 'forge-cell';
    const roll = rand();
    if (roll < 0.08) cell.classList.add('is-ember');
    else if (roll < 0.16) cell.classList.add('is-cyan');
    cell.style.setProperty('--cx', `${((rand() - 0.5) * 260).toFixed(0)}%`);
    cell.style.setProperty('--cy', `${((rand() - 0.5) * 260).toFixed(0)}%`);
    cell.style.setProperty('--cr', `${((rand() - 0.5) * 180).toFixed(0)}deg`);
    cell.style.setProperty('--cd', `${(rand() * 500).toFixed(0)}ms`);
    grid.appendChild(cell);
  }
  el.appendChild(grid);
}

function buildHabit(el) {
  const rand = seeded(23);
  const grid = document.createElement('div');
  grid.className = 'habit-grid';
  const cols = 14;
  const rows = 7;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cell = document.createElement('span');
      cell.className = 'habit-cell';
      // Consistency builds over time: later columns are more likely to be lit
      const momentum = c / (cols - 1);
      const v = rand() * 0.6 + momentum * 0.6;
      cell.dataset.level = v > 0.95 ? '3' : v > 0.7 ? '2' : v > 0.45 ? '1' : '0';
      cell.style.setProperty('--cd', `${c * 60 + r * 15}ms`);
      cell.style.gridColumn = String(c + 1);
      cell.style.gridRow = String(r + 1);
      grid.appendChild(cell);
    }
  }
  el.appendChild(grid);
}

export function initCovers() {
  document.querySelectorAll('[data-cover="forge"]').forEach(buildForge);
  document.querySelectorAll('[data-cover="habit"]').forEach(buildHabit);
}
