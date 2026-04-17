// ─── materias.js — Módulo CRUD de materias ────────────────────────────────────

const MateriasModule = (() => {

  // ── Estado ────────────────────────────────────────────────────────────────
  let _todos     = [];
  let _filtrados = [];
  let _toast     = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function colorLetra(nombre) {
    const colores = [
      ['#3730A3','#4F46E5'], ['#C2410C','#F97316'], ['#0F766E','#14B8A6'],
      ['#6D28D9','#8B5CF6'], ['#B45309','#F59E0B'], ['#065F46','#10B981'],
      ['#9D174D','#EC4899'], ['#1E40AF','#3B82F6'],
    ];
    let h = 0;
    for (let i = 0; i < nombre.length; i++) h = nombre.charCodeAt(i) + ((h << 5) - h);
    return colores[Math.abs(h) % colores.length];
  }

  function inicial(nombre) {
    return esc(nombre).trim().charAt(0).toUpperCase();
  }

  function formatFecha(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Cargar ────────────────────────────────────────────────────────────────
  async function cargar() {
    try {
      const r = await Api.materias.listar();
      if (!r) return;
      _todos     = r.data;
      _filtrados = [..._todos];
      _renderTarjetas();
      _actualizarStats();
    } catch {
      _toast('Error al cargar materias', 'error');
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  function _actualizarStats() {
    const el = document.getElementById('totalMaterias');
    if (el) el.textContent = _todos.length;

    const totalCal = _todos.reduce((s, m) => s + (parseInt(m.total_calificaciones) || 0), 0);
    const elCal = document.getElementById('totalCalificacionesMaterias');
    if (elCal) elCal.textContent = totalCal;
  }

  // ── Render grid de tarjetas ───────────────────────────────────────────────
  function _renderTarjetas() {
    const grid     = document.getElementById('materiasGrid');
    const emptyEl  = document.getElementById('materiasEmpty');
    const countEl  = document.getElementById('resultadoCount');

    if (countEl) countEl.textContent = `${_filtrados.length} materia${_filtrados.length !== 1 ? 's' : ''}`;

    if (_filtrados.length === 0) {
      grid.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    grid.innerHTML = _filtrados.map((m, i) => {
      const [gradA, gradB] = colorLetra(m.nombre);
      const cal = parseInt(m.total_calificaciones) || 0;
      return `
        <div class="materia-card" style="animation-delay:${i * 0.05}s">
          <div class="materia-card-top">
            <div class="materia-avatar" style="background:linear-gradient(135deg,${gradA},${gradB})">
              ${inicial(m.nombre)}
            </div>
            <div class="materia-card-actions">
              <button class="btn-icon btn-edit" onclick="MateriasModule.abrirEditar(${m.id})" title="Editar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button class="btn-icon btn-delete" onclick="MateriasModule.confirmarEliminar(${m.id}, '${esc(m.nombre)}')" title="Eliminar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Eliminar
              </button>
            </div>
          </div>
          <div class="materia-card-body">
            <h3 class="materia-nombre">${esc(m.nombre)}</h3>
            <div class="materia-meta">
              <span class="materia-cal-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                ${cal} calificación${cal !== 1 ? 'es' : ''}
              </span>
              <span class="materia-fecha">${formatFecha(m.created_at)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  function buscar(q) {
    const term = q.toLowerCase().trim();
    _filtrados = term
      ? _todos.filter(m => m.nombre.toLowerCase().includes(term))
      : [..._todos];
    _renderTarjetas();
  }

  // ── Modal crear / editar ──────────────────────────────────────────────────
  function abrirModal(titulo = 'Nueva Materia') {
    document.getElementById('modalMateriasTitulo').textContent = titulo;
    document.getElementById('modalMaterias').classList.remove('hidden');
    document.getElementById('materiasFormError').classList.add('hidden');
    document.getElementById('materiaNombre').focus();
  }

  function cerrarModal() {
    document.getElementById('modalMaterias').classList.add('hidden');
    document.getElementById('formMateria').reset();
    document.getElementById('materiaId').value = '';
  }

  async function abrirEditar(id) {
    try {
      const r = await Api.materias.obtener(id);
      if (!r || !r.ok) { _toast('Error al obtener la materia', 'error'); return; }
      document.getElementById('materiaId').value      = r.data.id;
      document.getElementById('materiaNombre').value  = r.data.nombre;
      abrirModal('Editar Materia');
    } catch {
      _toast('Error de conexión', 'error');
    }
  }

  async function guardar(e) {
    e.preventDefault();
    const errorEl = document.getElementById('materiasFormError');
    errorEl.classList.add('hidden');

    const id     = document.getElementById('materiaId').value;
    const nombre = document.getElementById('materiaNombre').value.trim();

    try {
      const r = id
        ? await Api.materias.actualizar(id, { nombre })
        : await Api.materias.crear({ nombre });

      if (!r) return;
      if (!r.ok) {
        errorEl.textContent = r.data.error || 'Error desconocido';
        errorEl.classList.remove('hidden');
        return;
      }
      cerrarModal();
      _toast(id ? 'Materia actualizada' : 'Materia creada', 'success');
      cargar();
    } catch {
      errorEl.textContent = 'Error de conexión';
      errorEl.classList.remove('hidden');
    }
  }

  // ── Modal eliminar ────────────────────────────────────────────────────────
  let _idEliminar = null;

  function confirmarEliminar(id, nombre) {
    _idEliminar = id;
    document.getElementById('nombreEliminarMateria').textContent = nombre;
    document.getElementById('modalEliminarMateria').classList.remove('hidden');
  }

  function cerrarEliminar() {
    document.getElementById('modalEliminarMateria').classList.add('hidden');
    _idEliminar = null;
  }

  async function ejecutarEliminar() {
    if (!_idEliminar) return;
    try {
      const r = await Api.materias.eliminar(_idEliminar);
      if (!r || !r.ok) { _toast(r?.data?.error || 'Error al eliminar', 'error'); return; }
      cerrarEliminar();
      _toast('Materia eliminada', 'success');
      cargar();
    } catch {
      _toast('Error de conexión', 'error');
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(toast) {
    _toast = toast;

    document.getElementById('btnNuevaMateria')
      .addEventListener('click', () => abrirModal('Nueva Materia'));

    document.getElementById('cerrarModalMaterias')
      .addEventListener('click', cerrarModal);
    document.getElementById('cancelarModalMaterias')
      .addEventListener('click', cerrarModal);
    document.querySelector('#modalMaterias .modal-overlay')
      .addEventListener('click', cerrarModal);

    document.getElementById('formMateria')
      .addEventListener('submit', guardar);

    document.getElementById('cerrarEliminarMateria')
      .addEventListener('click', cerrarEliminar);
    document.getElementById('cancelarEliminarMateria')
      .addEventListener('click', cerrarEliminar);
    document.querySelector('#modalEliminarMateria .modal-overlay')
      .addEventListener('click', cerrarEliminar);
    document.getElementById('confirmarEliminarMateria')
      .addEventListener('click', ejecutarEliminar);

    document.getElementById('searchMaterias')
      .addEventListener('input', e => buscar(e.target.value));

    cargar();
  }

  return { init, cargar, abrirEditar, confirmarEliminar };
})();
