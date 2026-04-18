// ─── artista-app.js — Perfil publico del artista ─────────────────────────────

// ── Tema ──────────────────────────────────────────────────────────────────────
(function applyTheme() {
  const stored = localStorage.getItem('forgepixel-theme') || 'dark';
  const pref   = stored === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : stored;
  document.documentElement.setAttribute('data-theme', pref);
})();

// ── Nav movil ─────────────────────────────────────────────────────────────────
(function initNav() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !toggle.contains(e.target))
      menu.classList.remove('open');
  });
  const nav = document.getElementById('landingNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }
})();

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Thumb por estilo ──────────────────────────────────────────────────────────
const THUMB_MAP = {
  'Pixel Art':   { cls: 'thumb-pixel',   label: 'PX' },
  'Ilustracion': { cls: 'thumb-ilust',   label: 'IL' },
  'Concept Art': { cls: 'thumb-concept', label: 'CA' },
  'Animacion':   { cls: 'thumb-anim',    label: 'AN' },
  'Personajes':  { cls: 'thumb-chars',   label: 'CH' },
  'Fondos':      { cls: 'thumb-bg',      label: 'FD' },
};

function thumbData(estilo) {
  return THUMB_MAP[estilo] || { cls: 'thumb-default', label: '??' };
}

// ── Session check para adaptar nav ────────────────────────────────────────────
async function checkSession() {
  try {
    const res  = await fetch('/api/sesion');
    const data = await res.json().catch(() => ({}));
    if (data.autenticado) {
      const actions   = document.getElementById('navActions');
      const mobileReg = document.getElementById('mobileRegBtn');
      if (actions)   actions.innerHTML = `<a href="/dashboard.html" class="btn btn-primary btn-sm">Mi Panel</a>`;
      if (mobileReg) { mobileReg.textContent = 'Mi Panel'; mobileReg.href = '/dashboard.html'; }
    }
  } catch { /* sin sesion */ }
}

// ── Cargar perfil del artista ─────────────────────────────────────────────────
async function cargarPerfil() {
  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');

  const loading = document.getElementById('profileLoading');
  const content = document.getElementById('profileContent');
  const error   = document.getElementById('profileError');

  if (!id || isNaN(Number(id))) {
    loading.style.display  = 'none';
    error.style.display    = 'block';
    return;
  }

  try {
    const res  = await fetch(`/api/artistas/${id}`);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.artista) {
      loading.style.display = 'none';
      error.style.display   = 'block';
      return;
    }

    const { artista, servicios } = data;

    // Llenar perfil
    const inicial = artista.nombre.trim().charAt(0).toUpperCase();
    document.getElementById('profileAvatar').textContent = inicial;
    document.getElementById('profileName').textContent   = artista.nombre;
    document.getElementById('profileRole').textContent   = artista.rol === 'artista' ? 'Artista' : (artista.rol === 'comprador' ? 'Comprador' : artista.rol);

    const bioEl = document.getElementById('profileBio');
    if (artista.bio) {
      bioEl.textContent   = artista.bio;
      bioEl.style.display = '';
    } else {
      bioEl.style.display = 'none';
    }

    if (artista.created_at) {
      const fecha = new Date(artista.created_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long'
      });
      document.getElementById('profileSince').textContent = `Miembro desde ${fecha}`;
    }

    document.title = `${artista.nombre} — Forge & Pixel`;

    // Renderizar servicios
    const grid  = document.getElementById('artistaServicios');
    const empty = document.getElementById('emptyArtista');
    const title = document.getElementById('profileServicesTitle');

    if (title) title.textContent = `Servicios de ${artista.nombre}`;

    if (!servicios || servicios.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      grid.innerHTML = servicios.map(s => {
        const thumb = thumbData(s.estilo);
        const precio = parseFloat(s.precio).toLocaleString('es-MX', {
          style: 'currency', currency: 'MXN', minimumFractionDigits: 2
        });
        return `
          <div class="service-card">
            <div class="service-card-thumb ${thumb.cls}">${thumb.label}</div>
            <div class="service-card-body">
              <div class="service-card-title">${esc(s.titulo)}</div>
              <div class="service-card-artist">por ${esc(artista.nombre)}</div>
              <div class="service-card-footer">
                <span class="service-price">${precio}</span>
                <div style="display:flex;align-items:center;gap:0.4rem;">
                  <span class="badge badge-accent">${esc(s.estilo)}</span>
                  <a href="/marketplace.html" class="btn btn-sm btn-cyan">Contratar</a>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    loading.style.display  = 'none';
    content.style.display  = 'block';

  } catch {
    loading.style.display = 'none';
    error.style.display   = 'block';
  }
}

checkSession();
cargarPerfil();
