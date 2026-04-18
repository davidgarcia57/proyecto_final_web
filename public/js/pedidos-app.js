// ─── pedidos-app.js ───────────────────────────────────────────────────────────

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
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function badgeEstado(estado) {
  const map = {
    pendiente:   'badge-yellow',
    en_proceso:  'badge-cyan',
    completado:  'badge-green',
    cancelado:   'badge-rose',
  };
  const labels = {
    pendiente:   'Pendiente',
    en_proceso:  'En proceso',
    completado:  'Completado',
    cancelado:   'Cancelado',
  };
  const cls   = map[estado]    || 'badge-muted';
  const label = labels[estado] || estado;
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Actualizar estadísticas de resumen ────────────────────────────────────────
function actualizarStats(pedidos) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('statTotal',      pedidos.length);
  set('statPendiente',  pedidos.filter(p => p.estado === 'pendiente').length);
  set('statEnProceso',  pedidos.filter(p => p.estado === 'en_proceso').length);
  set('statCompletado', pedidos.filter(p => p.estado === 'completado').length);
}

// ── Renderizar tabla ──────────────────────────────────────────────────────────
function renderTabla(pedidos) {
  const tbody = document.getElementById('pedidosTbody');
  const empty = document.getElementById('emptyPedidos');
  const contador = document.getElementById('contadorPedidos');

  actualizarStats(pedidos);

  if (contador) contador.textContent = `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}`;

  if (pedidos.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  tbody.innerHTML = pedidos.map(p => {
    const monto = parseFloat(p.monto).toLocaleString('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });
    return `
      <tr>
        <td class="td-mono">#${p.id}</td>
        <td>${escHtml(p.servicio_titulo)}</td>
        <td class="td-muted">${escHtml(p.comprador_nombre)}</td>
        <td class="td-mono">${monto}</td>
        <td>${badgeEstado(p.estado)}</td>
        <td class="td-muted">${formatFecha(p.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-ghost" onclick="abrirEditarEstado(${p.id}, '${p.estado}', ${JSON.stringify(p.notas || '')})" title="Cambiar estado">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-rose" onclick="eliminarPedido(${p.id})" title="Eliminar">
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

// ── Cargar pedidos ────────────────────────────────────────────────────────────
async function cargarPedidos() {
  const r = await Api.pedidos.listar();
  if (!r) return;
  renderTabla(r.data);
}

// ── Cargar servicios para el selector de nuevo pedido ─────────────────────────
async function cargarOpcionesServicios() {
  const r = await Api.servicios.listar();
  if (!r || !r.ok) return;

  const select = document.getElementById('pedidoServicio');
  select.innerHTML = '<option value="">-- Seleccionar servicio --</option>' +
    r.data.map(s => `<option value="${s.id}">${escHtml(s.titulo)} — ${escHtml(s.artista_nombre)}</option>`).join('');
}

// ── Modal: nuevo pedido ───────────────────────────────────────────────────────
const modalPedido = document.getElementById('modalPedido');

document.getElementById('btnNuevoPedido').addEventListener('click', () => {
  document.getElementById('pedidoServicio').value = '';
  document.getElementById('pedidoMonto').value    = '';
  document.getElementById('pedidoNotas').value    = '';
  cargarOpcionesServicios();
  modalPedido.classList.add('open');
});

document.getElementById('modalPedidoGuardar').addEventListener('click', async () => {
  const servicio_id = document.getElementById('pedidoServicio').value;
  const monto       = document.getElementById('pedidoMonto').value;
  const notas       = document.getElementById('pedidoNotas').value.trim() || null;

  if (!servicio_id || !monto) {
    mostrarToast('Selecciona un servicio y escribe el monto', 'error');
    return;
  }

  const btn = document.getElementById('modalPedidoGuardar');
  btn.disabled = true;

  const r = await Api.pedidos.crear({ servicio_id, monto, notas });
  btn.disabled = false;

  if (!r || !r.ok) {
    mostrarToast(r?.data?.error || 'Error al crear pedido', 'error');
    return;
  }

  mostrarToast('Pedido creado correctamente');
  modalPedido.classList.remove('open');
  cargarPedidos();
});

document.getElementById('modalPedidoClose').addEventListener('click', () => modalPedido.classList.remove('open'));
document.getElementById('modalPedidoCancelar').addEventListener('click', () => modalPedido.classList.remove('open'));
modalPedido.addEventListener('click', e => { if (e.target === modalPedido) modalPedido.classList.remove('open'); });

// ── Modal: editar estado ──────────────────────────────────────────────────────
const modalEstado = document.getElementById('modalEstado');

function abrirEditarEstado(id, estadoActual, notas) {
  document.getElementById('estadoPedidoId').value = id;
  document.getElementById('estadoSelect').value   = estadoActual;
  document.getElementById('estadoNotas').value    = notas || '';
  modalEstado.classList.add('open');
}

document.getElementById('modalEstadoGuardar').addEventListener('click', async () => {
  const id     = document.getElementById('estadoPedidoId').value;
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
  cargarPedidos();
});

document.getElementById('modalEstadoClose').addEventListener('click', () => modalEstado.classList.remove('open'));
document.getElementById('modalEstadoCancelar').addEventListener('click', () => modalEstado.classList.remove('open'));
modalEstado.addEventListener('click', e => { if (e.target === modalEstado) modalEstado.classList.remove('open'); });

// ── Eliminar pedido ───────────────────────────────────────────────────────────
async function eliminarPedido(id) {
  if (!confirm('Eliminar este pedido?')) return;
  const r = await Api.pedidos.eliminar(id);
  if (!r || !r.ok) { mostrarToast(r?.data?.error || 'Error al eliminar', 'error'); return; }
  mostrarToast('Pedido eliminado');
  cargarPedidos();
}

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

  cargarPedidos();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
