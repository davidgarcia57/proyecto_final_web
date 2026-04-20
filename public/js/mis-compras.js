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
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-ghost" onclick="abrirChat(${p.id}, ${JSON.stringify(p.servicio_titulo)})" title="Mensajes">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast toast-${tipo}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
let chatPedidoId  = null;
let chatUsuarioId = null;

function formatHora(iso)     { return new Date(iso).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }); }
function formatFechaMsg(iso) { return new Date(iso).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }); }

function abrirChat(pedidoId, titulo) {
  chatPedidoId = pedidoId;
  document.getElementById('chatTitle').textContent    = escHtml(titulo);
  document.getElementById('chatSubtitle').textContent = `Pedido #${pedidoId}`;
  document.getElementById('chatInput').value          = '';
  document.getElementById('chatPanel').classList.add('open');
  document.getElementById('chatOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  cargarMensajes();
}

function cerrarChat() {
  document.getElementById('chatPanel').classList.remove('open');
  document.getElementById('chatOverlay').classList.remove('open');
  document.body.style.overflow = '';
  chatPedidoId = null;
}

async function cargarMensajes() {
  if (!chatPedidoId) return;
  const r    = await Api.mensajes.listar(chatPedidoId);
  const area  = document.getElementById('chatMessages');
  const empty = document.getElementById('chatEmpty');

  if (!r || !r.ok) return;
  const msgs = Array.isArray(r.data) ? r.data : [];

  if (msgs.length === 0) {
    area.innerHTML = '';
    area.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  let lastFecha = null;
  area.innerHTML = msgs.map(m => {
    const esMio  = m.autor_id === chatUsuarioId;
    const fecha  = formatFechaMsg(m.created_at);
    let sep = '';
    if (fecha !== lastFecha) { lastFecha = fecha; sep = `<div class="chat-date-sep">${fecha}</div>`; }
    return `${sep}
      <div class="chat-msg ${esMio ? 'chat-msg-mine' : 'chat-msg-theirs'}">
        <div class="chat-bubble"><span class="chat-msg-text">${escHtml(m.contenido)}</span></div>
        <div class="chat-msg-meta">
          ${esMio ? '' : `<span class="chat-author">${escHtml(m.autor_nombre)}</span> · `}
          <span class="chat-time">${formatHora(m.created_at)}</span>
        </div>
      </div>`;
  }).join('');
  area.scrollTop = area.scrollHeight;
}

async function enviarMensaje() {
  const input    = document.getElementById('chatInput');
  const contenido = input.value.trim();
  if (!contenido || !chatPedidoId) return;
  const btn = document.getElementById('chatEnviar');
  btn.disabled = true;
  const r = await Api.mensajes.enviar(chatPedidoId, { contenido });
  btn.disabled = false;
  if (!r || !r.ok) { mostrarToast(r?.data?.error || 'Error al enviar', 'error'); return; }
  input.value = '';
  cargarMensajes();
}

document.getElementById('chatEnviar').addEventListener('click', enviarMensaje);
document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
});
document.getElementById('chatClose').addEventListener('click',   cerrarChat);
document.getElementById('chatOverlay').addEventListener('click', cerrarChat);

(async () => {
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) { window.location.href = '/login.html'; return; }

  const usuario = sesRes.data.usuario;
  if (usuario.rol === 'artista') { window.location.href = '/mis-ventas.html'; return; }

  document.body.classList.remove('app-loading');
  chatUsuarioId = usuario.id;

  const checkoutOk = sessionStorage.getItem('checkoutOk');
  if (checkoutOk) {
    sessionStorage.removeItem('checkoutOk');
    setTimeout(() => mostrarToast(`Pedido enviado: "${checkoutOk}"`, 'success'), 300);
  }

  populateSettingsProfile(usuario);
  const avatarEl = document.getElementById('topbarAvatar');
  avatarEl.textContent = usuario.nombre.trim().charAt(0).toUpperCase();
  avatarEl.classList.add('avatar-comprador');
  document.getElementById('topbarName').textContent   = usuario.nombre;

  const r = await Api.pedidos.compras();
  renderTabla((r?.ok && Array.isArray(r.data)) ? r.data : []);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
