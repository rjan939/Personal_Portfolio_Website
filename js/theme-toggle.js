/* Shared theme switcher for index.html, about.html, projects.html. */
(() => {
  'use strict';

  const KEY = 'portfolio-theme';
  const root = document.documentElement;

  // Default to light mode unless the user previously selected dark mode.
  const read = () => {
    try { return localStorage.getItem(KEY); }
    catch { return null; }
  };

  const save = value => {
    try { localStorage.setItem(KEY, value); }
    catch {}
  };

  const preferred = () => read() === 'dark' ? 'dark' : 'light';

  const refresh = () => {
    const dark = root.dataset.theme === 'dark';

    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.textContent = dark ? '\u2600' : '\u263E';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', String(dark));
    });
  };

  const apply = value => {
    root.dataset.theme = value;
    root.style.colorScheme = value;
    refresh();
  };

  // Apply saved preference, otherwise use light mode.
  apply(preferred());

  const makeButton = () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';

    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      save(next);
      apply(next);
    });

    return button;
  };

  const setup = () => {
    const desktop = document.querySelector('.sidebar > .sidebar-cta');
    const mobile = document.querySelector('.mobile-topbar');

    if (desktop && !desktop.querySelector('.theme-toggle')) {
      desktop.insertBefore(makeButton(), desktop.firstChild);
    }

    if (mobile && !mobile.querySelector('.theme-toggle')) {
      const nav = mobile.querySelector('.nav-toggle');
      mobile.insertBefore(makeButton(), nav || null);
    }

    refresh();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();