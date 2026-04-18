// ─── vallecardo-app.js ────────────────────────────────────────────────────────

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

// ── Formatear fecha ───────────────────────────────────────────────────────────
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Renderizar noticias ───────────────────────────────────────────────────────
function renderNoticias(noticias) {
  const grid  = document.getElementById('noticiasGrid');
  const empty = document.getElementById('emptyNoticias');

  if (noticias.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  grid.innerHTML = noticias.map(n => `
    <div class="news-card">
      <div class="news-card-header">
        <div class="news-card-title">${escHtml(n.titulo)}</div>
        <div class="news-card-date">${formatFecha(n.created_at)}</div>
      </div>
      <div class="news-card-body">
        <div class="news-card-content">${escHtml(n.contenido)}</div>
      </div>
      <div class="news-card-footer">
        <button class="btn btn-sm btn-ghost" onclick="abrirEditarNoticia(${n.id})" title="Editar">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button class="btn btn-sm btn-rose" onclick="eliminarNoticia(${n.id})" title="Eliminar">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

// ── Cargar noticias ───────────────────────────────────────────────────────────
async function cargarNoticias() {
  const r = await Api.noticias.listar();
  if (!r) return;
  renderNoticias(r.data);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const modalNoticia = document.getElementById('modalNoticia');

function abrirModal(titulo = 'Nueva Noticia') {
  document.getElementById('modalNoticiaTitulo').textContent = titulo;
  modalNoticia.classList.add('open');
}

function cerrarModal() {
  modalNoticia.classList.remove('open');
  document.getElementById('noticiaId').value       = '';
  document.getElementById('noticiaTitulo').value   = '';
  document.getElementById('noticiaContenido').value = '';
  document.getElementById('noticiaImagen').value   = '';
}

document.getElementById('btnNuevaNoticia').addEventListener('click', () => {
  cerrarModal();
  abrirModal('Nueva Noticia');
});

async function abrirEditarNoticia(id) {
  const r = await Api.noticias.listar();
  if (!r) return;
  const noticia = r.data.find(n => n.id === id);
  if (!noticia) return;

  document.getElementById('noticiaId').value        = noticia.id;
  document.getElementById('noticiaTitulo').value    = noticia.titulo;
  document.getElementById('noticiaContenido').value = noticia.contenido;
  document.getElementById('noticiaImagen').value    = noticia.imagen_url || '';

  abrirModal('Editar Noticia');
}

document.getElementById('modalNoticiaGuardar').addEventListener('click', async () => {
  const id        = document.getElementById('noticiaId').value;
  const titulo    = document.getElementById('noticiaTitulo').value.trim();
  const contenido = document.getElementById('noticiaContenido').value.trim();
  const imagen_url = document.getElementById('noticiaImagen').value.trim() || null;

  if (!titulo || !contenido) {
    mostrarToast('El titulo y contenido son obligatorios', 'error');
    return;
  }

  const btn = document.getElementById('modalNoticiaGuardar');
  btn.disabled = true;

  const body = { titulo, contenido, imagen_url };
  const r = id
    ? await Api.noticias.actualizar(id, body)
    : await Api.noticias.crear(body);

  btn.disabled = false;

  if (!r || !r.ok) {
    mostrarToast(r?.data?.error || 'Error al guardar', 'error');
    return;
  }

  mostrarToast(id ? 'Noticia actualizada' : 'Noticia publicada');
  cerrarModal();
  cargarNoticias();
});

async function eliminarNoticia(id) {
  if (!confirm('Eliminar esta noticia?')) return;
  const r = await Api.noticias.eliminar(id);
  if (!r || !r.ok) { mostrarToast(r?.data?.error || 'Error al eliminar', 'error'); return; }
  mostrarToast('Noticia eliminada');
  cargarNoticias();
}

document.getElementById('modalNoticiaClose').addEventListener('click', cerrarModal);
document.getElementById('modalNoticiaCancelar').addEventListener('click', cerrarModal);
modalNoticia.addEventListener('click', e => { if (e.target === modalNoticia) cerrarModal(); });

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) {
    window.location.href = '/login.html';
    return;
  }

  document.body.classList.remove('app-loading');

  const usuario  = sesRes.data.usuario;
  populateSettingsProfile(usuario);

  const initial  = usuario.nombre.trim().charAt(0).toUpperCase();
  const avatarEl = document.getElementById('topbarAvatar');
  const nameEl   = document.getElementById('topbarName');
  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl)   nameEl.textContent   = usuario.nombre;

  cargarNoticias();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
