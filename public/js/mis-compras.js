// ─── mis-compras.js ───────────────────────────────────────────────────────────

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

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
}

function badgeEstado(estado) {
  const map = { pendiente:'badge-yellow', en_proceso:'badge-cyan', completado:'badge-green', cancelado:'badge-rose' };
  const lbl = { pendiente:'Pendiente', en_proceso:'En proceso', completado:'Completado', cancelado:'Cancelado' };
  return `<span class="badge ${map[estado]||'badge-muted'}">${lbl[estado]||estado}</span>`;
}

function renderTabla(compras) {
  const tbody    = document.getElementById('comprasTbody');
  const empty    = document.getElementById('emptyCompras');
  const contador = document.getElementById('contadorCompras');

  if (contador) contador.textContent = `${compras.length} compra${compras.length !== 1 ? 's' : ''}`;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('scTotal',      compras.length);
  set('scPendiente',  compras.filter(c => c.estado === 'pendiente').length);
  set('scEnProceso',  compras.filter(c => c.estado === 'en_proceso').length);
  set('scCompletado', compras.filter(c => c.estado === 'completado').length);

  if (compras.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = compras.map(p => {
    const monto = parseFloat(p.monto).toLocaleString('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });
    return `
      <tr>
        <td class="td-mono">#${p.id}</td>
        <td>${escHtml(p.servicio_titulo)}</td>
        <td class="td-muted">${escHtml(p.artista_nombre)}</td>
        <td class="td-mono">${monto}</td>
        <td>${badgeEstado(p.estado)}</td>
        <td class="td-muted">${formatFecha(p.created_at)}</td>
      </tr>
    `;
  }).join('');
}

(async () => {
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) { window.location.href = '/login.html'; return; }

  const usuario = sesRes.data.usuario;
  document.body.classList.remove('app-loading');

  populateSettingsProfile(usuario);
  document.getElementById('topbarAvatar').textContent = usuario.nombre.trim().charAt(0).toUpperCase();
  document.getElementById('topbarName').textContent   = usuario.nombre;

  const r = await Api.pedidos.compras();
  renderTabla((r?.ok && Array.isArray(r.data)) ? r.data : []);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
