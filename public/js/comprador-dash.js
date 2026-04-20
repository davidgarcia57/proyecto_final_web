// ─── comprador-dash.js ────────────────────────────────────────────────────────

function mostrarToast(msg, tipo = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast toast-${tipo}`;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3200);
}

(function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle  = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;
  const open  = () => { sidebar.classList.add('open');    overlay.classList.add('open');    document.body.style.overflow = 'hidden'; };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };
  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const THUMB_MAP = {
  'Pixel Art':   { cls: 'thumb-pixel',   label: 'PX' },
  'Ilustracion': { cls: 'thumb-ilust',   label: 'IL' },
  'Concept Art': { cls: 'thumb-concept', label: 'CA' },
  'Animacion':   { cls: 'thumb-anim',    label: 'AN' },
  'Personajes':  { cls: 'thumb-chars',   label: 'CH' },
  'Fondos':      { cls: 'thumb-bg',      label: 'FD' },
};

function thumbData(estilo) { return THUMB_MAP[estilo] || { cls: 'thumb-default', label: '??' }; }

function renderDestacados(servicios) {
  const grid  = document.getElementById('destacadosGrid');
  const empty = document.getElementById('emptyDestacados');
  const lista = servicios.slice(0, 6);

  if (lista.length === 0) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  grid.innerHTML = lista.map(s => {
    const thumb = thumbData(s.estilo);
    const precio = parseFloat(s.precio).toLocaleString('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });
    const thumbEl = s.imagen_url
      ? `<div class="service-card-thumb thumb-img"><img src="${escHtml(s.imagen_url)}" alt="${escHtml(s.titulo)}" loading="lazy" /></div>`
      : `<div class="service-card-thumb ${thumb.cls}">${thumb.label}</div>`;

    return `
      <div class="service-card" style="cursor:pointer;" onclick="window.location='/marketplace.html'">
        ${thumbEl}
        <div class="service-card-body">
          <div class="service-card-title">${escHtml(s.titulo)}</div>
          <div class="service-card-artist">por ${escHtml(s.artista_nombre)}</div>
          <div class="service-card-footer">
            <span class="service-price">${precio}</span>
            <span class="badge badge-accent">${escHtml(s.estilo)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) { window.location.href = '/login.html'; return; }

  const usuario = sesRes.data.usuario;
  if (usuario.rol !== 'comprador') { window.location.href = '/artista-dashboard.html'; return; }

  document.body.classList.remove('app-loading');

  populateSettingsProfile(usuario);
  const avatarEl = document.getElementById('topbarAvatar');
  avatarEl.textContent = usuario.nombre.trim().charAt(0).toUpperCase();
  avatarEl.classList.add('avatar-comprador');
  document.getElementById('topbarName').textContent = usuario.nombre;
  document.getElementById('welcomeMsg').textContent   = `Bienvenido de vuelta, ${usuario.nombre}`;

  // Stats del marketplace
  const rStats = await Api.servicios.stats();
  if (rStats?.ok) {
    document.getElementById('statCatalogo').textContent = rStats.data.totalServicios ?? 0;
  }

  // Mis compras
  const rCompras = await Api.pedidos.compras();
  const compras  = (rCompras?.ok && Array.isArray(rCompras.data)) ? rCompras.data : [];
  document.getElementById('statMisCompras').textContent  = compras.length;
  document.getElementById('statEnProceso').textContent   = compras.filter(c => c.estado === 'en_proceso').length;
  document.getElementById('statCompletadas').textContent = compras.filter(c => c.estado === 'completado').length;

  // Servicios destacados
  const rServ = await Api.servicios.listar();
  if (rServ?.ok && Array.isArray(rServ.data)) renderDestacados(rServ.data);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
