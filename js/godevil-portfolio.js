function toggleNav() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  if (!btn) return;

  btn.textContent = 'sent OK';
  btn.style.background = 'var(--green)';

  setTimeout(() => {
    btn.textContent = 'send message ->';
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const currentPage = window.location.pathname.split('/').pop() || 'godevil-portfolio.html';
  const pageGroups = {
    projects: ['projects.html', 'problemforge.html', 'sves.html', 'habitx.html'],
    writing: ['writing.html'],
    nanolog: ['nanolog.html'],
  };

  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    const matchesDirect = href === currentPage;
    const matchesGroup = (
      (href === 'projects.html' && pageGroups.projects.includes(currentPage)) ||
      (href === 'writing.html' && pageGroups.writing.includes(currentPage)) ||
      (href === 'nanolog.html' && pageGroups.nanolog.includes(currentPage))
    );

    if (matchesDirect || matchesGroup) {
      link.classList.add('active');
    }

    link.addEventListener('click', () => {
      if (sidebar) {
        sidebar.classList.remove('open');
      }
    });
  });

  const cta = document.querySelector('.hire-btn');
  if (cta) {
    cta.addEventListener('click', () => {
      if (sidebar) {
        sidebar.classList.remove('open');
      }
    });
  }

  const ageElement = document.getElementById('current-age');
  if (ageElement) {
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
    setTimeout(() => {
      updateAge();
      setInterval(updateAge, 24 * 60 * 60 * 1000);
    }, nextMidnight - now);
  }
});
