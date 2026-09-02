function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const icon = btn.querySelector('.theme-icon');
  const label = btn.querySelector('.theme-label');

  function updateLabel() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (icon) icon.textContent = isDark ? '\u2600' : '\u263D'; // ☀ / ☽
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
    if (!icon && !label) btn.textContent = isDark ? 'Light' : 'Dark';
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  updateLabel();

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('monospace-theme', next);
    } catch (e) {
      // localStorage unavailable — theme just won't persist across visits
    }
    updateLabel();
  });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
