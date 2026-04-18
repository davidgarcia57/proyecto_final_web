// ─── login.js ─────────────────────────────────────────────────────────────────

// Redirigir si ya hay sesion activa
fetch('/api/sesion')
  .then(r => r.json())
  .then(data => { if (data.autenticado) window.location.href = '/'; });

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
  });
});

// Selector de rol en registro
let rolSeleccionado = 'comprador';

document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rolSeleccionado = btn.dataset.rol;
  });
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  const btn     = document.getElementById('loginBtn');
  errorEl.classList.add('hidden');
  btn.disabled = true;

  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res  = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.classList.remove('hidden');
    } else {
      window.location.href = '/';
    }
  } catch {
    errorEl.textContent = 'Error de conexion con el servidor';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
});

// Registro
document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('regMessage');
  const btn   = document.getElementById('regBtn');
  msgEl.className = 'alert hidden';
  btn.disabled    = true;

  const nombre   = document.getElementById('regNombre').value;
  const email    = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  if (password.length < 6) {
    msgEl.textContent = 'La contrasena debe tener al menos 6 caracteres';
    msgEl.classList.add('alert-error');
    msgEl.classList.remove('hidden');
    btn.disabled = false;
    return;
  }

  try {
    const res  = await fetch('/api/registro', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nombre, email, password, rol: rolSeleccionado })
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.error;
      msgEl.classList.add('alert-error');
    } else {
      msgEl.textContent = 'Cuenta creada correctamente. Ya puedes iniciar sesion.';
      msgEl.classList.add('alert-success');
      document.getElementById('registroForm').reset();
      rolSeleccionado = 'comprador';
      document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.role-btn[data-rol="comprador"]').classList.add('active');
    }
    msgEl.classList.remove('hidden');
  } catch {
    msgEl.textContent = 'Error de conexion con el servidor';
    msgEl.classList.add('alert-error');
    msgEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
});
