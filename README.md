# livedOG portfolio

Static site (HTML, CSS, vanilla JS modules). No build step.

## Run locally

```bash
python serve.py
```

Then open http://127.0.0.1:8000. ES modules need a server; opening the HTML file directly will not work.

On Vercel, `vercel.json` turns on clean URLs (`/levelforge` instead of `/levelforge.html`) and
`.vercelignore` keeps `_backup/`, the Python scripts and editor settings out of the deployment.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Home: hero, about, stack, work, contact, guestbook |
| `problemforge.html` | ProblemForge, the company, and its products |
| `levelforge.html`, `focuslock.html` | Long-form product case studies |
| `sves.html`, `habitx.html` | Older case studies, no longer linked |
| `html/livedog-portfolio.html` etc. | Redirects from the old addresses to the pages above |
| `css/og-system.css` | Design tokens (colour, type, spacing, motion, z-index) and shared components |
| `css/og-home.css` | Home sections and project cover motifs |
| `css/og-case.css` | Case-study layout |
| `js/og/main.js` | Home entry point |
| `js/og/case.js` | Case-study entry point |
| `js/og/hero-scene.js` | Three.js "forge core", lazy-loaded from a CDN |
| `js/og/motion.js` | Reveal, tilt, spotlight and scroll-progress utilities |
| `js/og/nav.js` | Scroll-spy navigation and mobile menu |
| `js/og/intro.js`, `name-flip.js` | livedOG ⇄ GODEVIL intro and name swap |
| `js/og/services.js` | Firebase + Lanyard (Spotify), loaded when the browser is idle |

Older pages (`about.html`, `skills.html`, `contact.html`, `projects.html`, `writing.html`,
`lifelog.html`, `nanolog.html`, `guestbook.html`, `godevil-portfolio.html`) still use the
legacy `livedog-portfolio.css/js` and are not linked from the redesigned site.

## Notes

- Fallbacks: no WebGL or "save data" shows a static SVG core; `prefers-reduced-motion`
  skips the intro and renders the core still.
- Add `?debug` to the home URL to expose `window.__ogScene` (`advance(seconds)`, `scatter()`).
- The intro plays whenever the home page is opened or reloaded; it is skipped when arriving
  from another page of the site or via Back/Forward. Reduced-motion users get a still version.
