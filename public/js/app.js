// ─── app.js — Orquestador del dashboard ──────────────────────────────────────

function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast toast-${tipo}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// Sidebar toggle (movil)
(function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle  = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  function openSidebar()  {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () =>
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
  );
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
})();

// Cargar estadisticas del dashboard
async function cargarStats() {
  try {
    const r = await Api.servicios.stats();
    if (!r || !r.ok) return;

    const { totalServicios, totalArtistas, totalPedidos } = r.data;

    const elServ  = document.getElementById('totalServicios');
    const elPed   = document.getElementById('totalPedidos');
    const elArt   = document.getElementById('totalArtistas');

    if (elServ) elServ.textContent = totalServicios ?? 0;
    if (elPed)  elPed.textContent  = totalPedidos   ?? 0;
    if (elArt)  elArt.textContent  = totalArtistas  ?? 0;
  } catch {
    mostrarToast('Error al cargar estadisticas', 'error');
  }
}

// Arranque
(async () => {
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) {
    window.location.href = '/login.html';
    return;
  }

  document.body.classList.remove('app-loading');

  const usuario = sesRes.data.usuario;
  populateSettingsProfile(usuario);

  const initial  = usuario.nombre.trim().charAt(0).toUpperCase();
  const avatarEl = document.getElementById('topbarAvatar');
  const nameEl   = document.getElementById('topbarName');
  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl)   nameEl.textContent   = usuario.nombre;

  cargarStats();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
