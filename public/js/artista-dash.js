// ─── artista-dash.js ──────────────────────────────────────────────────────────

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

function renderMiniGrid(servicios) {
  const grid  = document.getElementById('misServiciosGrid');
  const empty = document.getElementById('emptyMisServicios');
  const lista = servicios.slice(0, 6);

  if (lista.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = lista.map(s => {
    const thumb = thumbData(s.estilo);
    const precio = parseFloat(s.precio).toLocaleString('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });
    const thumbEl = s.imagen_url
      ? `<div class="service-card-thumb thumb-img"><img src="${escHtml(s.imagen_url)}" alt="${escHtml(s.titulo)}" loading="lazy" /></div>`
      : `<div class="service-card-thumb ${thumb.cls}">${thumb.label}</div>`;

    const estadoBadge = s.estado === 'activo'
      ? `<span class="badge badge-green">Activo</span>`
      : `<span class="badge badge-rose">Inactivo</span>`;

    return `
      <div class="service-card">
        ${thumbEl}
        <div class="service-card-body">
          <div class="service-card-title">${escHtml(s.titulo)}</div>
          <div class="service-card-footer">
            <span class="service-price">${precio}</span>
            <div style="display:flex;gap:0.4rem;align-items:center;">
              ${estadoBadge}
              <span class="badge badge-accent">${escHtml(s.estilo)}</span>
            </div>
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
  if (usuario.rol !== 'artista') { window.location.href = '/comprador-dashboard.html'; return; }

  document.body.classList.remove('app-loading');

  populateSettingsProfile(usuario);
  const avatarEl = document.getElementById('topbarAvatar');
  avatarEl.textContent = usuario.nombre.trim().charAt(0).toUpperCase();
  avatarEl.classList.add('avatar-artista');
  document.getElementById('topbarName').textContent = usuario.nombre;

  // A7: welcomeName es el <span> del nombre, welcomeMsg es el subtítulo
  const welcomeNameEl = document.getElementById('welcomeName');
  const welcomeMsgEl  = document.getElementById('welcomeMsg');
  if (welcomeNameEl) welcomeNameEl.textContent = usuario.nombre;
  if (welcomeMsgEl)  welcomeMsgEl.textContent  = 'Forjando el futuro del pixel art indie';

  // Cargar servicios propios
  const rServ = await Api.servicios.propios();
  const servicios = (rServ?.ok && Array.isArray(rServ.data)) ? rServ.data : [];
  const activos   = servicios.filter(s => s.estado === 'activo').length;

  // Cargar ventas
  const rVentas = await Api.pedidos.ventas();
  const ventas      = (rVentas?.ok && Array.isArray(rVentas.data)) ? rVentas.data : [];
  const completados = ventas.filter(v => v.estado === 'completado');
  const pendientes  = ventas.filter(v => v.estado === 'pendiente').length;
  const ingresos    = completados
    .reduce((acc, v) => acc + parseFloat(v.monto || 0), 0)
    .toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById('statMisServicios').textContent = activos;
  document.getElementById('statTotalVentas').textContent  = ventas.length;
  document.getElementById('statPendientes').textContent   = pendientes;
  document.getElementById('statIngresos').textContent     = `$${ingresos}`;

  // A6: Cargar rating del perfil propio y llamar a populateHPBars
  let ratingPromedio = 0;
  try {
    const rPerfil = await fetch(`/api/artistas/${usuario.id}`);
    if (rPerfil.ok) {
      const perfil = await rPerfil.json();
      ratingPromedio = parseFloat(perfil.artista?.rating_promedio || 0);
      // Mostrar saldo de oro
      const oroEl = document.getElementById('statOro');
      if (oroEl) oroEl.textContent = parseFloat(perfil.artista?.saldo_oro || 0).toFixed(0);
    }
  } catch (_) {}

  if (typeof window.populateHPBars === 'function') {
    window.populateHPBars({
      nombre:       usuario.nombre,
      rating:       ratingPromedio,
      totalPedidos: ventas.length,
      completados:  completados.length,
      saldo_oro:    usuario.saldo_oro ?? 0
    });
  }

  renderMiniGrid(servicios);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
