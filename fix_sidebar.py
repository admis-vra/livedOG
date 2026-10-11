import os
import re

html_dir = r"C:\Users\PRINCE\Desktop\FOUNDER\GODEVIL\html"

new_sidebar = """<aside class="sidebar" id="sidebar">
  <div class="sidebar-profile" style="display: flex; align-items: center; gap: 16px;">
    <img class="sidebar-avatar" src="../assets/images/Siddhant.jpeg" alt="livedOG avatar" />
    <div class="sidebar-name">livedOG</div>
  </div>

  <nav>
    <div class="nav-group">
      <a href="livedog-portfolio.html#hero" class="nav-link"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span> home</a>
      <a href="livedog-portfolio.html#projects" class="nav-link"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></span> projects</a>
      <a href="livedog-portfolio.html#nanolog" class="nav-link"><span class="nav-icon">N</span> nanolog</a>
      <a href="livedog-portfolio.html#contact" class="nav-link"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span> contact</a>
      <a href="livedog-portfolio.html#guestbook" class="nav-link"><span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span> guestbook</a>
    </div>
  </nav>

  <div class="spotify-widget" id="spotify-widget">
    <a href="#" id="spotify-link" target="_blank" class="spotify-container">
      <img id="spotify-cover" src="" alt="Album Cover" class="spotify-cover" />
      <div class="spotify-info">
        <div class="spotify-title-wrapper">
           <span class="spotify-icon"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.781-.18-.6.18-1.2.78-1.381 4.32-1.26 11.28-1.02 15.72 1.621.54.3.72.96.42 1.5-.3.541-.96.72-1.62.42z"/></svg></span>
           <span id="spotify-title" class="spotify-title">Not Listening</span>
        </div>
        <span id="spotify-artist" class="spotify-artist">Spotify</span>
      </div>
    </a>
  </div>

  <a href="livedog-portfolio.html#contact" class="hire-btn">work with me -></a>
</aside>"""

mobile_header = """<!-- Mobile Header Bar -->
<header class="mobile-top-bar">
  <div class="mobile-brand">
    <img class="mobile-avatar" src="../assets/images/Siddhant.jpeg" alt="livedOG avatar" />
    <div class="mobile-brand-info">
      <span class="mobile-brand-name">livedOG</span>
      <span class="mobile-brand-status"><span class="status-dot"></span> online</span>
    </div>
  </div>
  <button class="mobile-nav-toggle" onclick="toggleNav()" aria-label="Toggle navigation">
    <span class="hamburger-box">
      <span></span>
      <span></span>
      <span></span>
    </span>
    <span class="nav-toggle-text">Menu</span>
  </button>
</header>
<div class="sidebar-backdrop" id="sidebar-backdrop" onclick="toggleNav()"></div>
"""

for file in os.listdir(html_dir):
    if file.endswith('.html'):
        path = os.path.join(html_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '<header class="mobile-top-bar">' not in content:
            if re.search(r'<button class="mobile-nav-toggle"[^>]*>.*?</button>', content):
                content = re.sub(r'<button class="mobile-nav-toggle"[^>]*>.*?</button>', mobile_header, content)
            elif '<aside class="sidebar"' in content:
                content = content.replace('<aside class="sidebar"', mobile_header + '\n<aside class="sidebar"')

        pattern = re.compile(r'<aside class="sidebar"[^>]*>.*?</aside>', re.DOTALL)
        if pattern.search(content):
            content = pattern.sub(new_sidebar, content)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
