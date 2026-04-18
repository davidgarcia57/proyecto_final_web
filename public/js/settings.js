// ─── settings.js — Tema y panel de ajustes ────────────────────────────────────
const THEME_KEY = 'forgepixel-theme';

function getSystemPref() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference) {
  const resolved = preference === 'system' ? getSystemPref() : preference;
  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem(THEME_KEY, preference);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === preference);
  });
}

// Aplicar tema antes de que el DOM este listo para evitar flash
(function () {
  const saved    = localStorage.getItem(THEME_KEY) || 'dark';
  const resolved = saved === 'system' ? getSystemPref() : saved;
  document.documentElement.setAttribute('data-theme', resolved);
})();

document.addEventListener('DOMContentLoaded', () => {

  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === saved);
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeVal));
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'dark') === 'system') {
      applyTheme('system');
    }
  });

  // ── Panel de ajustes ─────────────────────────────────────────────────────
  const panel    = document.getElementById('settingsPanel');
  const overlay  = document.getElementById('settingsOverlay');
  const gearBtn  = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettings');

  if (!panel) return;

  function openPanel() {
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  gearBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });
});

// ── Funciones publicas para poblar perfil ─────────────────────────────────────
function populateSettingsProfile(usuario) {
  const initial = usuario.nombre.trim().charAt(0).toUpperCase();

  const avatarEl = document.getElementById('settingsAvatar');
  const nameEl   = document.getElementById('settingsName');
  const emailEl  = document.getElementById('settingsEmail');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl)   nameEl.textContent   = usuario.nombre;
  if (emailEl)  emailEl.textContent  = usuario.email || '—';
}
