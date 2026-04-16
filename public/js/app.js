// ─── app.js — Orquestador principal ───────────────────────────────────────────
// Principio O (Open/Closed): coordina módulos sin conocer su implementación.
// Para añadir un nuevo módulo sólo se importa y se inicializa aquí, sin
// modificar los módulos existentes.

// ── Toast global (compartido entre módulos) ───────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast toast-${tipo}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ── Helper de escape (compartido) ────────────────────────────────────────────
function escapar(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  // 1. Verificar sesión
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) {
    window.location.href = '/login.html';
    return;
  }

  const usuario = sesRes.data.usuario;

  // 2. Poblar navbar y settings con datos del usuario
  const nombreEl = document.getElementById('usuarioNombre');
  if (nombreEl) nombreEl.textContent = usuario.nombre;
  populateSettingsProfile(usuario);

  // Actualizar avatar en navbar
  const avatarEl = document.getElementById('navbarAvatar');
  if (avatarEl && usuario.nombre)
    avatarEl.textContent = usuario.nombre.trim().charAt(0).toUpperCase();

  // 3. Inicializar módulos (Principio O: sólo se llama init, sin acoplamientos)
  AlumnosModule.init(mostrarToast);

  // 4. Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });
})();
