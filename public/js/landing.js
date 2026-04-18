// ─── landing.js — Pagina de inicio publica ────────────────────────────────────

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

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
    }
  });

  const nav = document.getElementById('landingNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }
})();

// ── Escaping ──────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Session check → adaptar nav ───────────────────────────────────────────────
async function checkSession() {
  try {
    const res = await fetch('/api/sesion');
    const data = await res.json().catch(() => ({}));

    if (data.autenticado) {
      // Reemplazar botones de login/registro por link al panel
      const actions   = document.getElementById('navActions');
      const mobileReg = document.getElementById('mobileRegBtn');
      const heroReg   = document.getElementById('heroRegBtn');
      const ctaReg    = document.getElementById('ctaRegBtn');

      if (actions) {
        actions.innerHTML = `<a href="/dashboard.html" class="btn btn-primary btn-sm">Mi Panel</a>`;
      }
      if (mobileReg) {
        mobileReg.textContent = 'Mi Panel';
        mobileReg.href = '/dashboard.html';
      }
      if (heroReg) {
        heroReg.textContent = 'Ir al Panel';
        heroReg.href = '/dashboard.html';
      }
      if (ctaReg) {
        ctaReg.textContent = 'Ir al Panel';
        ctaReg.href = '/dashboard.html';
      }
    }
  } catch {
    // Sin sesion activa — no hacer nada
  }
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

// ── Cargar servicios destacados ───────────────────────────────────────────────
async function cargarDestacados() {
  const grid  = document.getElementById('serviciosDestacados');
  const empty = document.getElementById('emptyDestacados');
  if (!grid) return;

  try {
    const res  = await fetch('/api/servicios');
    const data = await res.json().catch(() => []);
    const lista = Array.isArray(data) ? data.slice(0, 6) : [];

    if (lista.length === 0) {
      grid.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');

    grid.innerHTML = lista.map(s => {
      const thumb = thumbData(s.estilo);
      const precio = parseFloat(s.precio).toLocaleString('es-MX', {
        style: 'currency', currency: 'MXN', minimumFractionDigits: 2
      });
      const thumbEl = s.imagen_url
        ? `<div class="service-card-thumb thumb-img"><img src="${esc(s.imagen_url)}" alt="${esc(s.titulo)}" loading="lazy" onerror="this.closest('.service-card-thumb').className='service-card-thumb ${thumb.cls}';this.closest('.service-card-thumb').textContent='${thumb.label}'" /></div>`
        : `<div class="service-card-thumb ${thumb.cls}">${thumb.label}</div>`;

      return `
        <div class="service-card">
          ${thumbEl}
          <div class="service-card-body">
            <div class="service-card-title">${esc(s.titulo)}</div>
            <div class="service-card-artist">
              <a href="/artista.html?id=${s.artista_id}" style="color:inherit;text-decoration:none;">
                por ${esc(s.artista_nombre)}
              </a>
            </div>
            <div class="service-card-footer">
              <span class="service-price">${precio}</span>
              <div style="display:flex;align-items:center;gap:0.4rem;">
                <span class="badge badge-accent">${esc(s.estilo)}</span>
                <a href="/marketplace.html" class="btn btn-sm btn-cyan">Ver</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch {
    empty?.classList.remove('hidden');
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
checkSession();
cargarDestacados();
