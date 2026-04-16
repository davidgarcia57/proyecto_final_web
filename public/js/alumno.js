// ─── alumno.js — Página de detalle de un alumno ───────────────────────────────
// Maneja toda la lógica de la vista de detalle:
//   - Cargar y mostrar datos del alumno
//   - CRUD de calificaciones con formulario inline (sin modales)
//   - Edición de datos del alumno (modal ligero)

// ── Toast ─────────────────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
  const t = document.getElementById('toast');
  t.textContent = mensaje;
  t.className   = `toast toast-${tipo}`;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add('hidden'), 3200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function badgeClass(cal) {
  if (cal >= 9)  return 'cal-badge-green';
  if (cal >= 7)  return 'cal-badge-blue';
  if (cal >= 6)  return 'cal-badge-yellow';
  return 'cal-badge-red';
}

// ── Estado ────────────────────────────────────────────────────────────────────
let alumnoId    = null;
let materias    = [];
let calActual   = []; // lista de calificaciones en pantalla

// ── Leer ID de la URL ─────────────────────────────────────────────────────────
function getAlumnoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ── Cargar y mostrar datos del alumno ─────────────────────────────────────────
async function cargarAlumno() {
  const r = await Api.alumnos.obtener(alumnoId);
  if (!r || !r.ok) {
    document.getElementById('heroNombre').textContent = 'Alumno no encontrado';
    return;
  }
  const a = r.data;
  document.title = `EduGest — ${a.nombre}`;

  const inicial = a.nombre.trim().charAt(0).toUpperCase();
  document.getElementById('heroAvatar').textContent  = inicial;
  document.getElementById('heroNombre').textContent  = a.nombre;

  const meta = document.getElementById('heroMeta');
  meta.innerHTML = `
    <span class="group-badge">${esc(a.grupo)}</span>
    ${a.email    ? `<span class="hero-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      ${esc(a.email)}</span>` : ''}
    ${a.telefono ? `<span class="hero-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18v.92z"/></svg>
      ${esc(a.telefono)}</span>` : ''}
  `;

  // Pre-llenar form de edición
  document.getElementById('editAlumnoId').value  = a.id;
  document.getElementById('editNombre').value    = a.nombre;
  document.getElementById('editGrupo').value     = a.grupo;
  document.getElementById('editEmail').value     = a.email    || '';
  document.getElementById('editTelefono').value  = a.telefono || '';
}

// ── Cargar materias ───────────────────────────────────────────────────────────
async function cargarMaterias() {
  if (materias.length > 0) return;
  const r = await Api.materias.listar();
  if (r && r.ok) materias = r.data;

  const sel = document.getElementById('qMateria');
  sel.innerHTML = '<option value="">Seleccionar materia…</option>' +
    materias.map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('');
}

// ── Cargar y renderizar calificaciones ───────────────────────────────────────
async function cargarCalificaciones() {
  const r = await Api.calificaciones.porAlumno(alumnoId);
  if (!r) return;
  calActual = r.ok ? r.data : [];
  renderCalificaciones();
}

function renderCalificaciones() {
  const tbody = document.getElementById('tbodyCal');
  const chip  = document.getElementById('promedioChip');
  const promEl = document.getElementById('promedioVal');

  if (calActual.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-row">
          Sin calificaciones aún. Usa el formulario de arriba para agregar la primera.
        </td>
      </tr>`;
    if (chip) chip.style.display = 'none';
    return;
  }

  tbody.innerHTML = calActual.map(c => `
    <tr id="row-cal-${c.id}">
      <td><strong>${esc(c.materia)}</strong></td>
      <td><span class="cal-badge ${badgeClass(c.calificacion)}">${parseFloat(c.calificacion).toFixed(1)}</span></td>
      <td><span class="periodo-badge">${esc(c.periodo)}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon btn-edit"
            onclick="editarCalificacion(${c.id}, ${c.materia_id}, ${c.calificacion}, '${esc(c.periodo)}')">
            Editar
          </button>
          <button class="btn-icon btn-delete"
            onclick="eliminarCalificacion(${c.id})">
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Promedio
  const suma  = calActual.reduce((s, c) => s + parseFloat(c.calificacion), 0);
  const prom  = (suma / calActual.length).toFixed(1);
  if (chip)  { chip.style.display = ''; }
  if (promEl){ promEl.textContent = prom; promEl.className = `cal-badge ${badgeClass(prom)}`; }
}

// ── Formulario rápido (agregar / editar) ──────────────────────────────────────
document.getElementById('formQuickCal').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl   = document.getElementById('quickFormError');
  errEl.classList.add('hidden');

  const id      = document.getElementById('qCalId').value;
  const materia = document.getElementById('qMateria').value;
  const cal     = document.getElementById('qCalificacion').value;
  const periodo = document.getElementById('qPeriodo').value;

  if (!materia) {
    errEl.textContent = 'Selecciona una materia';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const r = id
      ? await Api.calificaciones.actualizar(id, { calificacion: cal, periodo })
      : await Api.calificaciones.crear({ alumno_id: alumnoId, materia_id: materia, calificacion: cal, periodo });

    if (!r) return;
    if (!r.ok) {
      errEl.textContent = r.data.error || 'Error al guardar';
      errEl.classList.remove('hidden');
      return;
    }
    resetQuickForm();
    mostrarToast(id ? 'Calificación actualizada' : 'Calificación agregada', 'success');
    cargarCalificaciones();
  } catch {
    errEl.textContent = 'Error de conexión';
    errEl.classList.remove('hidden');
  }
});

function resetQuickForm() {
  document.getElementById('formQuickCal').reset();
  document.getElementById('qCalId').value         = '';
  document.getElementById('qPeriodo').value        = '2025-1';
  document.getElementById('quickBtnLabel').textContent = 'Agregar';
  document.getElementById('btnGuardarQuick').className = 'btn btn-primary';
  document.getElementById('btnCancelarQuick').style.display = 'none';
  document.getElementById('quickFormError').classList.add('hidden');
}

document.getElementById('btnCancelarQuick').addEventListener('click', resetQuickForm);

// Carga el form con los datos de la calificación a editar
function editarCalificacion(id, materiaId, cal, periodo) {
  document.getElementById('qCalId').value          = id;
  document.getElementById('qMateria').value        = materiaId;
  document.getElementById('qCalificacion').value   = cal;
  document.getElementById('qPeriodo').value        = periodo;
  document.getElementById('quickBtnLabel').textContent = 'Guardar cambios';
  document.getElementById('btnGuardarQuick').className = 'btn btn-warning';
  document.getElementById('btnCancelarQuick').style.display = '';
  document.getElementById('quickFormError').classList.add('hidden');

  // Scroll suave al formulario
  document.getElementById('formQuickCal').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function eliminarCalificacion(id) {
  if (!confirm('¿Eliminar esta calificación?')) return;
  const r = await Api.calificaciones.eliminar(id);
  if (!r || !r.ok) { mostrarToast('Error al eliminar', 'error'); return; }
  mostrarToast('Calificación eliminada', 'success');
  cargarCalificaciones();
}

// ── Modal editar datos del alumno ─────────────────────────────────────────────
document.getElementById('btnEditarAlumno').addEventListener('click', () => {
  document.getElementById('modalEditarAlumno').classList.remove('hidden');
  document.getElementById('editFormError').classList.add('hidden');
});

function cerrarModalEditar() {
  document.getElementById('modalEditarAlumno').classList.add('hidden');
}

document.getElementById('cerrarModalEditar').addEventListener('click', cerrarModalEditar);
document.getElementById('cancelarModalEditar').addEventListener('click', cerrarModalEditar);
document.querySelector('#modalEditarAlumno .modal-overlay').addEventListener('click', cerrarModalEditar);

document.getElementById('formEditarAlumno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('editFormError');
  errEl.classList.add('hidden');

  const id       = document.getElementById('editAlumnoId').value;
  const nombre   = document.getElementById('editNombre').value.trim();
  const grupo    = document.getElementById('editGrupo').value.trim();
  const email    = document.getElementById('editEmail').value.trim();
  const telefono = document.getElementById('editTelefono').value.trim();

  const r = await Api.alumnos.actualizar(id, { nombre, grupo, email, telefono });
  if (!r) return;
  if (!r.ok) {
    errEl.textContent = r.data.error || 'Error al actualizar';
    errEl.classList.remove('hidden');
    return;
  }
  cerrarModalEditar();
  mostrarToast('Datos actualizados', 'success');
  cargarAlumno();
});

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await Api.logout();
  window.location.href = '/login.html';
});

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  // Verificar sesión
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) {
    window.location.href = '/login.html';
    return;
  }

  const usuario = sesRes.data.usuario;
  document.getElementById('usuarioNombre').textContent = usuario.nombre;
  populateSettingsProfile(usuario);
  const av = document.getElementById('navbarAvatar');
  if (av) av.textContent = usuario.nombre.trim().charAt(0).toUpperCase();

  // Obtener ID del alumno
  alumnoId = getAlumnoId();
  if (!alumnoId) {
    window.location.href = '/index.html';
    return;
  }

  // Cargar datos en paralelo
  await Promise.all([cargarAlumno(), cargarMaterias()]);
  await cargarCalificaciones();
})();
