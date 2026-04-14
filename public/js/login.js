// Redirigir si ya hay sesión activa
fetch('/api/sesion')
  .then(r => r.json())
  .then(data => {
    if (data.autenticado) window.location.href = '/';
  });

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
  });
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  errorEl.classList.add('hidden');

  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.classList.remove('hidden');
      return;
    }
    window.location.href = '/';
  } catch {
    errorEl.textContent = 'Error de conexión con el servidor';
    errorEl.classList.remove('hidden');
  }
});

// Registro
document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('regMessage');
  msgEl.className = 'alert hidden';

  const nombre   = document.getElementById('regNombre').value;
  const email    = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  if (password.length < 6) {
    msgEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
    msgEl.classList.add('alert-error');
    msgEl.classList.remove('hidden');
    return;
  }

  try {
    const res  = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.error;
      msgEl.classList.add('alert-error');
    } else {
      msgEl.textContent = '¡Cuenta creada! Ahora puedes iniciar sesión.';
      msgEl.classList.add('alert-success');
      document.getElementById('registroForm').reset();
    }
    msgEl.classList.remove('hidden');
  } catch {
    msgEl.textContent = 'Error de conexión con el servidor';
    msgEl.classList.add('alert-error');
    msgEl.classList.remove('hidden');
  }
});
