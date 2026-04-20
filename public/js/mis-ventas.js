// ─── mis-ventas.js ────────────────────────────────────────────────────────────

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

function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast toast-${tipo}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

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

function renderTabla(ventas) {
  const tbody    = document.getElementById('ventasTbody');
  const empty    = document.getElementById('emptyVentas');
  const contador = document.getElementById('contadorVentas');

  if (contador) contador.textContent = `${ventas.length} venta${ventas.length !== 1 ? 's' : ''}`;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('svTotal',      ventas.length);
  set('svPendiente',  ventas.filter(v => v.estado === 'pendiente').length);
  set('svEnProceso',  ventas.filter(v => v.estado === 'en_proceso').length);

  const ingresos = ventas
    .filter(v => v.estado === 'completado')
    .reduce((sum, v) => sum + parseFloat(v.monto), 0);
  const el = document.getElementById('svIngresos');
  if (el) el.textContent = ingresos.toLocaleString('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:0 });

  if (ventas.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = ventas.map(v => {
    const monto = parseFloat(v.monto).toLocaleString('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });
    return `
      <tr>
        <td class="td-mono">#${v.id}</td>
        <td>${escHtml(v.servicio_titulo)}</td>
        <td class="td-muted">${escHtml(v.comprador_nombre)}</td>
        <td class="td-mono">${monto}</td>
        <td>${badgeEstado(v.estado)}</td>
        <td class="td-muted">${formatFecha(v.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-ghost" onclick="abrirEditarEstado(${v.id}, '${v.estado}', ${JSON.stringify(v.notas || '')})" title="Cambiar estado">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-rose" onclick="eliminarVenta(${v.id})" title="Eliminar">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Modal: editar estado ──────────────────────────────────────────────────────
const modalEstado = document.getElementById('modalEstado');

function abrirEditarEstado(id, estadoActual, notas) {
  document.getElementById('estadoVentaId').value = id;
  document.getElementById('estadoSelect').value  = estadoActual;
  document.getElementById('estadoNotas').value   = notas || '';
  modalEstado.classList.add('open');
}

document.getElementById('modalEstadoGuardar').addEventListener('click', async () => {
  const id     = document.getElementById('estadoVentaId').value;
  const estado = document.getElementById('estadoSelect').value;
  const notas  = document.getElementById('estadoNotas').value.trim() || null;

  const btn = document.getElementById('modalEstadoGuardar');
  btn.disabled = true;

  const r = await Api.pedidos.actualizar(id, { estado, notas });
  btn.disabled = false;

  if (!r || !r.ok) {
    mostrarToast(r?.data?.error || 'Error al actualizar', 'error');
    return;
  }

  mostrarToast('Estado actualizado');
  modalEstado.classList.remove('open');
  cargarVentas();
});

document.getElementById('modalEstadoClose').addEventListener('click',    () => modalEstado.classList.remove('open'));
document.getElementById('modalEstadoCancelar').addEventListener('click', () => modalEstado.classList.remove('open'));
modalEstado.addEventListener('click', e => { if (e.target === modalEstado) modalEstado.classList.remove('open'); });

async function eliminarVenta(id) {
  if (!confirm('Eliminar este pedido? Esta accion no se puede deshacer.')) return;
  const r = await Api.pedidos.eliminar(id);
  if (!r || !r.ok) { mostrarToast(r?.data?.error || 'Error al eliminar', 'error'); return; }
  mostrarToast('Pedido eliminado');
  cargarVentas();
}

async function cargarVentas() {
  const r = await Api.pedidos.ventas();
  renderTabla((r?.ok && Array.isArray(r.data)) ? r.data : []);
}

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

  cargarVentas();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
