// ─── marketplace-app.js ───────────────────────────────────────────────────────

function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast toast-${tipo}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

(function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle  = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;
  function openSidebar()  { sidebar.classList.add('open');    overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }
  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
})();

// ── Estado ────────────────────────────────────────────────────────────────────
let todosLosServicios = [];
let filtroActual      = 'todos';
let usuarioAuth       = null;

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

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Renderizar grilla ─────────────────────────────────────────────────────────
function renderGrilla(servicios) {
  const grid  = document.getElementById('serviciosGrid');
  const empty = document.getElementById('emptyServicios');

  if (servicios.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  grid.innerHTML = servicios.map(s => {
    const thumb = thumbData(s.estilo);
    const precio = parseFloat(s.precio).toLocaleString('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });

    const thumbEl = s.imagen_url
      ? `<div class="service-card-thumb thumb-img">
           <img src="${escHtml(s.imagen_url)}" alt="${escHtml(s.titulo)}" loading="lazy"
             onerror="this.closest('.service-card-thumb').className='service-card-thumb ${thumb.cls}';this.closest('.service-card-thumb').textContent='${thumb.label}'" />
         </div>`
      : `<div class="service-card-thumb ${thumb.cls}">${thumb.label}</div>`;

    const accionesCrud = usuarioAuth ? `
      <div class="service-card-actions">
        <button class="btn btn-sm btn-ghost" onclick="abrirEditar(${s.id})" title="Editar">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-sm btn-rose" onclick="eliminarServicio(${s.id})" title="Eliminar">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    ` : `
      <button class="btn btn-sm btn-cyan" onclick="contratar(${s.id})" title="Contratar servicio">
        Contratar
      </button>
    `;

    return `
      <div class="service-card">
        ${thumbEl}
        <div class="service-card-body">
          <div class="service-card-title">${escHtml(s.titulo)}</div>
          <div class="service-card-artist">
            <a href="/artista.html?id=${s.artista_id}" style="color:inherit;text-decoration:none;" onmouseover="this.style.color='var(--cyan)'" onmouseout="this.style.color='inherit'">
              por ${escHtml(s.artista_nombre)}
            </a>
          </div>
          <div class="service-card-footer">
            <span class="service-price">${precio}</span>
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <span class="badge badge-accent">${escHtml(s.estilo)}</span>
              ${accionesCrud}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Contratar (publico ve, invitado redirige a login) ─────────────────────────
function contratar(servicioId) {
  if (!usuarioAuth) {
    window.location.href = '/login.html';
    return;
  }
  // Usuario autenticado: abrir modal de nuevo pedido pre-cargado
  const selectServicio = document.getElementById('pedidoServicio');
  if (selectServicio) {
    selectServicio.value = servicioId;
    document.getElementById('modalPedido')?.classList.add('open');
  }
}

// ── Cargar servicios ──────────────────────────────────────────────────────────
async function cargarServicios() {
  const r = await Api.servicios.listar();
  if (!r || !r.ok) return;
  todosLosServicios = Array.isArray(r.data) ? r.data : [];
  aplicarFiltro();
}

function aplicarFiltro() {
  if (filtroActual === 'todos') {
    renderGrilla(todosLosServicios);
  } else {
    renderGrilla(todosLosServicios.filter(s => s.estilo === filtroActual));
  }
}

// ── Filtros ───────────────────────────────────────────────────────────────────
document.getElementById('filterBar').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filtroActual = btn.dataset.estilo;
  aplicarFiltro();
});

// ── Modal helpers ─────────────────────────────────────────────────────────────
const modalServicio = document.getElementById('modalServicio');

function abrirModal(titulo = 'Nuevo Servicio') {
  document.getElementById('modalServicioTitulo').textContent = titulo;
  modalServicio.classList.add('open');
}

function cerrarModal() {
  modalServicio.classList.remove('open');
  limpiarFormulario();
}

function limpiarFormulario() {
  document.getElementById('servicioId').value     = '';
  document.getElementById('servicioTitulo').value = '';
  document.getElementById('servicioDesc').value   = '';
  document.getElementById('servicioPrecio').value = '';
  document.getElementById('servicioEstilo').value = 'Pixel Art';
  document.getElementById('servicioImagen').value = '';
  document.getElementById('servicioEstado').value = 'activo';
  document.getElementById('estadoGroup').style.display = 'none';
}

document.getElementById('btnNuevoServicio').addEventListener('click', () => {
  if (!usuarioAuth) { window.location.href = '/login.html'; return; }
  limpiarFormulario();
  abrirModal('Nuevo Servicio');
});

// ── Abrir para editar ─────────────────────────────────────────────────────────
async function abrirEditar(id) {
  const r = await Api.servicios.obtener(id);
  if (!r || !r.ok) { mostrarToast('Error al cargar servicio', 'error'); return; }

  const s = r.data;
  document.getElementById('servicioId').value     = s.id;
  document.getElementById('servicioTitulo').value = s.titulo;
  document.getElementById('servicioDesc').value   = s.descripcion;
  document.getElementById('servicioPrecio').value = s.precio;
  document.getElementById('servicioEstilo').value = s.estilo;
  document.getElementById('servicioImagen').value = s.imagen_url || '';
  document.getElementById('servicioEstado').value = s.estado;
  document.getElementById('estadoGroup').style.display = '';

  abrirModal('Editar Servicio');
}

// ── Guardar ───────────────────────────────────────────────────────────────────
document.getElementById('modalServicioGuardar').addEventListener('click', async () => {
  const id          = document.getElementById('servicioId').value;
  const titulo      = document.getElementById('servicioTitulo').value.trim();
  const descripcion = document.getElementById('servicioDesc').value.trim();
  const precio      = document.getElementById('servicioPrecio').value;
  const estilo      = document.getElementById('servicioEstilo').value;
  const imagen_url  = document.getElementById('servicioImagen').value.trim() || null;
  const estado      = document.getElementById('servicioEstado').value;

  if (!titulo || !descripcion || !precio) {
    mostrarToast('Completa todos los campos obligatorios', 'error');
    return;
  }

  const body = { titulo, descripcion, precio, estilo, imagen_url, estado };
  const btn  = document.getElementById('modalServicioGuardar');
  btn.disabled = true;

  const r = id
    ? await Api.servicios.actualizar(id, body)
    : await Api.servicios.crear(body);

  btn.disabled = false;

  if (!r || !r.ok) {
    mostrarToast(r?.data?.error || 'Error al guardar', 'error');
    return;
  }

  mostrarToast(id ? 'Servicio actualizado' : 'Servicio creado');
  cerrarModal();
  cargarServicios();
});

// ── Eliminar ──────────────────────────────────────────────────────────────────
async function eliminarServicio(id) {
  if (!confirm('Eliminar este servicio? Esta accion no se puede deshacer.')) return;
  const r = await Api.servicios.eliminar(id);
  if (!r || !r.ok) { mostrarToast(r?.data?.error || 'Error al eliminar', 'error'); return; }
  mostrarToast('Servicio eliminado');
  cargarServicios();
}

// ── Cerrar modal ──────────────────────────────────────────────────────────────
document.getElementById('modalServicioClose').addEventListener('click', cerrarModal);
document.getElementById('modalServicioCancelar').addEventListener('click', cerrarModal);
modalServicio.addEventListener('click', e => { if (e.target === modalServicio) cerrarModal(); });

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  const sesRes = await Api.sesionPublica();
  const autenticado = sesRes?.data?.autenticado === true;

  document.body.classList.remove('app-loading');

  const btnNuevo = document.getElementById('btnNuevoServicio');

  if (autenticado) {
    usuarioAuth = sesRes.data.usuario;

    populateSettingsProfile(usuarioAuth);

    const initial  = usuarioAuth.nombre.trim().charAt(0).toUpperCase();
    const avatarEl = document.getElementById('topbarAvatar');
    const nameEl   = document.getElementById('topbarName');
    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl)   nameEl.textContent   = usuarioAuth.nombre;

    if (btnNuevo) btnNuevo.style.display = '';

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await Api.logout();
      window.location.href = '/login.html';
    });
  } else {
    // Invitado: ocultar boton nuevo servicio y mostrar link a login en topbar
    if (btnNuevo) btnNuevo.style.display = 'none';

    const avatarEl = document.getElementById('topbarAvatar');
    const nameEl   = document.getElementById('topbarName');
    if (avatarEl) avatarEl.textContent = '?';
    if (nameEl)   nameEl.innerHTML = `<a href="/login.html" style="color:var(--cyan);font-size:0.82rem;">Iniciar sesion</a>`;

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      window.location.href = '/login.html';
    });
  }

  cargarServicios();
})();
