// ─── EduGest Settings — Theme & Panel ────────────────────────────────────────
// Runs BEFORE app.js. Applies saved theme immediately to avoid flash.

const THEME_KEY = 'edugest-theme';

// ── Theme helpers ─────────────────────────────────────────────────────────────
function getSystemPref() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference) {
  const resolved = preference === 'system' ? getSystemPref() : preference;
  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem(THEME_KEY, preference);

  // Sync button states
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === preference);
  });
}

// Apply immediately (before DOM is ready) to prevent flash
(function () {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  const resolved = saved === 'system' ? getSystemPref() : saved;
  document.documentElement.setAttribute('data-theme', resolved);
})();

// Re-sync buttons and listen for system changes once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

  // Sync button active state on load
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === saved);
  });

  // Theme button clicks
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeVal));
  });

  // React to system theme changes (only if preference is "system")
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') {
      applyTheme('system');
    }
  });

  // ── Settings Panel ─────────────────────────────────────────────────────────
  const panel   = document.getElementById('settingsPanel');
  const overlay = document.getElementById('settingsOverlay');
  const gearBtn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettings');

  function openPanel() {
    panel.classList.add('open');
    overlay.classList.add('open');
    gearBtn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    gearBtn.classList.remove('open');
    document.body.style.overflow = '';
  }

  gearBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });
});

// ── Public: populate profile info (called from app.js after session loads) ───
function populateSettingsProfile(usuario) {
  const initial = usuario.nombre.trim().charAt(0).toUpperCase();

  const avatarEl = document.getElementById('settingsAvatar');
  const nameEl   = document.getElementById('settingsName');
  const emailEl  = document.getElementById('settingsEmail');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl)   nameEl.textContent   = usuario.nombre;
  if (emailEl)  emailEl.textContent  = usuario.email || '—';
}

// ── Public: update quick stats in settings panel ──────────────────────────────
function updateSettingsStats(totalAlumnos, totalGrupos) {
  const a = document.getElementById('settingsTotalAlumnos');
  const g = document.getElementById('settingsTotalGrupos');
  if (a) a.textContent = totalAlumnos;
  if (g) g.textContent = totalGrupos;
}
