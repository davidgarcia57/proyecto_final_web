// ─── checkout-app.js ──────────────────────────────────────────────────────────

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

const CMP_COLOR = { Simple: 'badge-cyan', Detallado: 'badge-yellow', 'Épico': 'badge-accent', Epico: 'badge-accent' };

// ── Formatear como moneda ─────────────────────────────────────────────────────
function fmtMXN(val) {
  return parseFloat(val).toLocaleString('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2
  });
}

// ── Formatear número de tarjeta ───────────────────────────────────────────────
document.getElementById('cardNumber').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').substring(0, 16);
  this.value = v.replace(/(.{4})/g, '$1 ').trim();
});
document.getElementById('cardExp').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').substring(0, 4);
  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
  this.value = v;
});

// ── Alternar formularios de pago ──────────────────────────────────────────────
const radiosBtns = document.querySelectorAll('input[name="metodoPago"]');
const formTarjeta = document.getElementById('formTarjeta');
const formPaypal  = document.getElementById('formPaypal');
const formOro     = document.getElementById('formOro');

let oroUsuario = 0;
let precioServicio = 0;

function actualizarFormPago() {
  const metodo = document.querySelector('input[name="metodoPago"]:checked')?.value;
  formTarjeta.classList.toggle('hidden', metodo !== 'tarjeta');
  formPaypal.classList.toggle('hidden',  metodo !== 'paypal');
  formOro.classList.toggle('hidden',     metodo !== 'oro');

  if (metodo === 'oro') {
    const oroNecesario = Math.ceil(precioServicio);
    const suficiente   = oroUsuario >= oroNecesario;
    document.getElementById('oroSuficienteMsg').classList.toggle('hidden', !suficiente);
    document.getElementById('oroInsuficienteMsg').classList.toggle('hidden', suficiente);
    document.getElementById('oroNeeded').textContent = oroNecesario;
    document.getElementById('btnConfirmar').disabled = !suficiente;
  } else {
    document.getElementById('btnConfirmar').disabled = false;
  }

  // marcar opción activa
  document.querySelectorAll('.payment-option').forEach(el => {
    const radio = el.querySelector('input[type="radio"]');
    el.classList.toggle('payment-option--active', radio?.checked);
  });
}

radiosBtns.forEach(r => r.addEventListener('change', actualizarFormPago));

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) { window.location.href = '/login.html'; return; }

  const usuario = sesRes.data.usuario;
  document.body.classList.remove('app-loading');

  populateSettingsProfile(usuario);
  const avatarEl = document.getElementById('topbarAvatar');
  avatarEl.textContent = usuario.nombre.trim().charAt(0).toUpperCase();
  avatarEl.classList.add(usuario.rol === 'artista' ? 'avatar-artista' : 'avatar-comprador');
  document.getElementById('topbarName').textContent = usuario.nombre;

  const rolLabel  = document.getElementById('sidebarRoleLabel');
  const panelLink = document.getElementById('sidebarPanelLink');
  if (rolLabel)  rolLabel.textContent = usuario.rol === 'artista' ? 'Artista' : 'Comprador';
  if (panelLink) panelLink.href = usuario.rol === 'artista' ? '/artista-dashboard.html' : '/comprador-dashboard.html';

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });

  // Leer saldo de oro del perfil (artistas)
  try {
    const rPerfil = await fetch(`/api/artistas/${usuario.id}`);
    if (rPerfil.ok) {
      const perfil = await rPerfil.json();
      oroUsuario = parseFloat(perfil.artista?.saldo_oro || 0);
    }
  } catch (_) {}
  document.getElementById('oroDisponible').textContent = oroUsuario.toFixed(0);

  // Leer ?id= de la URL
  const params    = new URLSearchParams(location.search);
  const servicioId = parseInt(params.get('id'), 10);

  if (!servicioId) {
    document.getElementById('checkoutLoading').classList.add('hidden');
    document.getElementById('checkoutError').classList.remove('hidden');
    return;
  }

  // Cargar servicio
  const rServ = await Api.servicios.obtener(servicioId);
  document.getElementById('checkoutLoading').classList.add('hidden');

  if (!rServ || !rServ.ok) {
    document.getElementById('checkoutError').classList.remove('hidden');
    return;
  }

  const s = rServ.data;
  precioServicio = parseFloat(s.precio || 0);

  // Rellenar resumen
  const thumb = thumbData(s.estilo);
  const thumbEl = document.getElementById('summaryThumb');
  if (s.imagen_url) {
    thumbEl.innerHTML = `<img src="${escHtml(s.imagen_url)}" alt="${escHtml(s.titulo)}" />`;
    thumbEl.className = 'checkout-thumb thumb-img';
  } else {
    thumbEl.textContent = thumb.label;
    thumbEl.className   = `checkout-thumb ${thumb.cls}`;
  }

  document.getElementById('summaryTitulo').textContent  = s.titulo;
  document.getElementById('summaryArtista').textContent = s.artista_nombre || '—';

  const cmpCls = CMP_COLOR[s.complejidad] || 'badge-cyan';
  document.getElementById('summaryBadges').innerHTML = `
    <span class="badge badge-accent">${escHtml(s.estilo)}</span>
    <span class="badge ${cmpCls}">${escHtml(s.complejidad || 'Simple')}</span>
  `;

  const precioFmt = fmtMXN(s.precio);
  document.getElementById('summaryPrecio').textContent = precioFmt;
  document.getElementById('summaryTotal').textContent  = precioFmt;

  // Mostrar contenido
  document.getElementById('checkoutContent').classList.remove('hidden');
  actualizarFormPago();

  // ── Confirmar pedido ──────────────────────────────────────────────────────
  document.getElementById('btnConfirmar').addEventListener('click', async () => {
    const metodo = document.querySelector('input[name="metodoPago"]:checked')?.value;
    const notas  = document.getElementById('checkoutNotas').value.trim() || null;
    const btn    = document.getElementById('btnConfirmar');

    // Validación básica por método
    if (metodo === 'tarjeta') {
      const num  = document.getElementById('cardNumber').value.replace(/\s/g, '');
      const nom  = document.getElementById('cardName').value.trim();
      const exp  = document.getElementById('cardExp').value.trim();
      const cvv  = document.getElementById('cardCvv').value.trim();
      if (num.length < 13 || !nom || exp.length < 5 || cvv.length < 3) {
        mostrarToast('Completa los datos de tu tarjeta.', 'error');
        return;
      }
    } else if (metodo === 'paypal') {
      const email = document.getElementById('paypalEmail').value.trim();
      if (!email || !email.includes('@')) {
        mostrarToast('Ingresa un correo de PayPal válido.', 'error');
        return;
      }
    } else if (metodo === 'oro') {
      if (oroUsuario < Math.ceil(precioServicio)) {
        mostrarToast('Saldo de oro insuficiente.', 'error');
        return;
      }
    }

    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    const r = await Api.pedidos.crear({ servicio_id: servicioId, monto: s.precio, notas });

    btn.disabled    = false;
    btn.textContent = 'Confirmar Pedido';

    if (!r || !r.ok) {
      mostrarToast(r?.data?.error || 'Error al crear el pedido.', 'error');
      return;
    }

    // Redirigir a mis compras con feedback de éxito
    sessionStorage.setItem('checkoutOk', s.titulo);
    window.location.href = '/mis-compras.html';
  });
})();
