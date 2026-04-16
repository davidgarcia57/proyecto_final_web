// ─── calificaciones.js — Módulo de calificaciones ────────────────────────────
// Principio S (Single Responsibility): sólo maneja UI y lógica de calificaciones.
// Principio L (Liskov): mantiene la misma interfaz de ciclo init/cargar/render
// que AlumnosModule para coherencia entre módulos.

const CalificacionesModule = (() => {

  // ── Estado interno ────────────────────────────────────────────────────────
  let _alumnoId   = null;
  let _materias   = [];
  let _toast      = null;
  let _modoEditar = false; // true = editando calificación existente

  // ── Helpers ───────────────────────────────────────────────────────────────
  function badgeColor(cal) {
    if (cal >= 9)  return 'cal-badge-green';
    if (cal >= 7)  return 'cal-badge-blue';
    if (cal >= 6)  return 'cal-badge-yellow';
    return 'cal-badge-red';
  }

  function promedio(lista) {
    if (lista.length === 0) return null;
    const sum = lista.reduce((acc, c) => acc + parseFloat(c.calificacion), 0);
    return (sum / lista.length).toFixed(1);
  }

  // ── Cargar materias (una sola vez) ────────────────────────────────────────
  async function _cargarMaterias() {
    if (_materias.length > 0) return;
    const r = await Api.materias.listar();
    if (r && r.ok) _materias = r.data;
  }

  function _llenarSelectMaterias(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar materia…</option>' +
      _materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
  }

  // ── Cargar y renderizar calificaciones del alumno ─────────────────────────
  async function _cargar() {
    if (!_alumnoId) return;
    const r = await Api.calificaciones.porAlumno(_alumnoId);
    if (!r) return;
    _renderLista(r.ok ? r.data : []);
  }

  function _renderLista(lista) {
    const tbody = document.getElementById('tbodyCalificaciones');
    const promEl = document.getElementById('calPromedio');

    if (lista.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-row">
            Sin calificaciones registradas. Agrega la primera usando el formulario.
          </td>
        </tr>`;
      if (promEl) promEl.innerHTML = '';
      return;
    }

    tbody.innerHTML = lista.map(c => `
      <tr>
        <td><strong>${c.materia}</strong></td>
        <td>
          <span class="cal-badge ${badgeColor(c.calificacion)}">
            ${parseFloat(c.calificacion).toFixed(1)}
          </span>
        </td>
        <td><span class="periodo-badge">${c.periodo}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon btn-edit"
              onclick="CalificacionesModule.editarCalificacion(${c.id}, ${c.materia_id}, ${c.calificacion}, '${c.periodo}')">
              Editar
            </button>
            <button class="btn-icon btn-delete"
              onclick="CalificacionesModule.eliminarCalificacion(${c.id})">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Promedio
    const prom = promedio(lista);
    if (promEl && prom !== null) {
      promEl.innerHTML = `
        <div class="cal-promedio-badge ${badgeColor(prom)}">
          Promedio general: <strong>${prom}</strong>
        </div>`;
    }

    // Actualizar el stat card de promedio en el dashboard
    Api.alumnos.stats().then(r => {
      if (!r || !r.ok) return;
      const el = document.getElementById('promedioGeneral');
      if (el) el.textContent = r.data.promedioGeneral !== null ? r.data.promedioGeneral : '—';
    });
  }

  // ── Abrir modal con calificaciones de un alumno ───────────────────────────
  async function abrirModal(alumnoId, alumnoNombre) {
    _alumnoId = alumnoId;
    document.getElementById('calModalTitulo').textContent   = `Calificaciones — ${alumnoNombre}`;
    document.getElementById('calModalSubtitulo').textContent = `Alumno ID #${alumnoId}`;
    document.getElementById('modalCalificaciones').classList.remove('hidden');
    _resetForm();
    await _cargarMaterias();
    _llenarSelectMaterias('calMateria');
    _cargar();
  }

  function cerrarModal() {
    document.getElementById('modalCalificaciones').classList.add('hidden');
    _alumnoId = null;
    _resetForm();
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  function _resetForm() {
    const form = document.getElementById('formCalificacion');
    if (form) form.reset();
    const idEl = document.getElementById('calId');
    if (idEl) idEl.value = '';
    _modoEditar = false;
    const btn = document.getElementById('btnGuardarCal');
    if (btn) btn.textContent = 'Guardar calificación';
    const errEl = document.getElementById('calFormError');
    if (errEl) errEl.classList.add('hidden');
    const cancelBtn = document.getElementById('cancelarCalForm');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  function editarCalificacion(id, materiaId, cal, periodo) {
    _modoEditar = true;
    document.getElementById('calId').value          = id;
    document.getElementById('calMateria').value     = materiaId;
    document.getElementById('calCalificacion').value = cal;
    document.getElementById('calPeriodo').value     = periodo;

    const btn = document.getElementById('btnGuardarCal');
    if (btn) btn.textContent = 'Actualizar calificación';

    const cancelBtn = document.getElementById('cancelarCalForm');
    if (cancelBtn) cancelBtn.style.display = '';

    // Scroll al form
    document.getElementById('formCalificacion').scrollIntoView({ behavior: 'smooth' });
  }

  async function _guardar(e) {
    e.preventDefault();
    const errEl = document.getElementById('calFormError');
    errEl.classList.add('hidden');

    const id       = document.getElementById('calId').value;
    const materiaId = document.getElementById('calMateria').value;
    const calVal   = document.getElementById('calCalificacion').value;
    const periodo  = document.getElementById('calPeriodo').value;

    if (!materiaId) {
      errEl.textContent = 'Selecciona una materia';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      const r = _modoEditar && id
        ? await Api.calificaciones.actualizar(id, { calificacion: calVal, periodo })
        : await Api.calificaciones.crear({
            alumno_id: _alumnoId, materia_id: materiaId,
            calificacion: calVal, periodo
          });

      if (!r) return;
      if (!r.ok) {
        errEl.textContent = r.data.error || 'Error al guardar';
        errEl.classList.remove('hidden');
        return;
      }
      _toast(_modoEditar ? 'Calificación actualizada' : 'Calificación guardada', 'success');
      _resetForm();
      _cargar();
    } catch {
      errEl.textContent = 'Error de conexión';
      errEl.classList.remove('hidden');
    }
  }

  async function eliminarCalificacion(id) {
    if (!confirm('¿Eliminar esta calificación?')) return;
    try {
      const r = await Api.calificaciones.eliminar(id);
      if (!r || !r.ok) { _toast('Error al eliminar', 'error'); return; }
      _toast('Calificación eliminada', 'success');
      _cargar();
    } catch {
      _toast('Error de conexión', 'error');
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(toast) {
    _toast = toast;

    document.getElementById('cerrarCalModal')
      .addEventListener('click', cerrarModal);
    document.querySelector('#modalCalificaciones .modal-overlay')
      .addEventListener('click', cerrarModal);
    document.getElementById('formCalificacion')
      .addEventListener('submit', _guardar);
    document.getElementById('cancelarCalForm')
      .addEventListener('click', _resetForm);
  }

  // ── API pública del módulo ────────────────────────────────────────────────
  return { init, abrirModal, editarCalificacion, eliminarCalificacion };

})();
