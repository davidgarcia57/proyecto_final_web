// ─── Estado global ───────────────────────────────────────────────────────────
let alumnos = [];
let alumnoAEliminarId = null;

// ─── Verificar sesión al cargar ───────────────────────────────────────────────
(async () => {
  const res  = await fetch('/api/sesion');
  const data = await res.json();
  if (!data.autenticado) {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('usuarioNombre').textContent = data.usuario.nombre;
  cargarAlumnos();
})();

// ─── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout');
  window.location.href = '/login.html';
});

// ─── Cargar alumnos ───────────────────────────────────────────────────────────
async function cargarAlumnos() {
  try {
    const res = await fetch('/api/alumnos');
    if (res.status === 401) { window.location.href = '/login.html'; return; }
    alumnos = await res.json();
    renderTabla(alumnos);
    actualizarStats();
  } catch {
    mostrarToast('Error al cargar alumnos', 'error');
  }
}

// ─── Renderizar tabla ─────────────────────────────────────────────────────────
function renderTabla(lista) {
  const tbody = document.getElementById('tbodyAlumnos');
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No hay alumnos registrados</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(a => `
    <tr>
      <td>${a.id}</td>
      <td><strong>${escapar(a.nombre)}</strong></td>
      <td><span class="badge">${escapar(a.grupo)}</span></td>
      <td>${a.email ? escapar(a.email) : '<span style="color:#94a3b8">—</span>'}</td>
      <td>${a.telefono ? escapar(a.telefono) : '<span style="color:#94a3b8">—</span>'}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon btn-edit"   onclick="abrirEditar(${a.id})">Editar</button>
          <button class="btn-icon btn-delete" onclick="confirmarEliminar(${a.id}, '${escapar(a.nombre)}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function actualizarStats() {
  document.getElementById('totalAlumnos').textContent = alumnos.length;
  const grupos = new Set(alumnos.map(a => a.grupo));
  document.getElementById('totalGrupos').textContent = grupos.size;
}

// ─── Búsqueda ─────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtrados = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(q) || a.grupo.toLowerCase().includes(q)
  );
  renderTabla(filtrados);
});

// ─── Modal Alumno ─────────────────────────────────────────────────────────────
function abrirModal(titulo = 'Nuevo Alumno') {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalAlumno').classList.remove('hidden');
  document.getElementById('formError').classList.add('hidden');
}

function cerrarModal() {
  document.getElementById('modalAlumno').classList.add('hidden');
  document.getElementById('formAlumno').reset();
  document.getElementById('alumnoId').value = '';
}

document.getElementById('btnNuevoAlumno').addEventListener('click', () => {
  abrirModal('Nuevo Alumno');
});
document.getElementById('cerrarModal').addEventListener('click', cerrarModal);
document.getElementById('cancelarModal').addEventListener('click', cerrarModal);
document.querySelector('#modalAlumno .modal-overlay').addEventListener('click', cerrarModal);

// Abrir modal para editar
async function abrirEditar(id) {
  try {
    const res  = await fetch(`/api/alumnos/${id}`);
    const data = await res.json();
    document.getElementById('alumnoId').value       = data.id;
    document.getElementById('alumnoNombre').value   = data.nombre;
    document.getElementById('alumnoGrupo').value    = data.grupo;
    document.getElementById('alumnoEmail').value    = data.email || '';
    document.getElementById('alumnoTelefono').value = data.telefono || '';
    abrirModal('Editar Alumno');
  } catch {
    mostrarToast('Error al obtener datos del alumno', 'error');
  }
}

// Guardar (crear o editar)
document.getElementById('formAlumno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('formError');
  errorEl.classList.add('hidden');

  const id       = document.getElementById('alumnoId').value;
  const nombre   = document.getElementById('alumnoNombre').value.trim();
  const grupo    = document.getElementById('alumnoGrupo').value.trim();
  const email    = document.getElementById('alumnoEmail').value.trim();
  const telefono = document.getElementById('alumnoTelefono').value.trim();

  const url    = id ? `/api/alumnos/${id}` : '/api/alumnos';
  const method = id ? 'PUT' : 'POST';

  try {
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, grupo, email, telefono })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.classList.remove('hidden');
      return;
    }
    cerrarModal();
    mostrarToast(id ? 'Alumno actualizado' : 'Alumno creado', 'success');
    cargarAlumnos();
  } catch {
    errorEl.textContent = 'Error de conexión';
    errorEl.classList.remove('hidden');
  }
});

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
function confirmarEliminar(id, nombre) {
  alumnoAEliminarId = id;
  document.getElementById('nombreEliminar').textContent = nombre;
  document.getElementById('modalEliminar').classList.remove('hidden');
}

function cerrarEliminar() {
  document.getElementById('modalEliminar').classList.add('hidden');
  alumnoAEliminarId = null;
}

document.getElementById('cerrarEliminar').addEventListener('click', cerrarEliminar);
document.getElementById('cancelarEliminar').addEventListener('click', cerrarEliminar);
document.querySelector('#modalEliminar .modal-overlay').addEventListener('click', cerrarEliminar);

document.getElementById('confirmarEliminar').addEventListener('click', async () => {
  if (!alumnoAEliminarId) return;
  try {
    const res = await fetch(`/api/alumnos/${alumnoAEliminarId}`, { method: 'DELETE' });
    if (!res.ok) { mostrarToast('Error al eliminar', 'error'); return; }
    cerrarEliminar();
    mostrarToast('Alumno eliminado', 'success');
    cargarAlumnos();
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = `toast toast-${tipo}`;
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapar(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
