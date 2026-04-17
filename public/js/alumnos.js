// ─── alumnos.js — Módulo de gestión de alumnos ────────────────────────────────
// Principio S (Single Responsibility): sólo maneja UI y lógica de alumnos.
// Principio I (Interface Segregation): expone sólo lo que app.js necesita.

const AlumnosModule = (() => {

  // ── Estado interno ────────────────────────────────────────────────────────
  const POR_PAGINA   = 10;
  let _todos         = [];   // todos los alumnos cargados
  let _filtrados     = [];   // resultado de búsqueda activa
  let _pagina        = 1;
  let _toast         = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inicial(nombre) {
    return esc(nombre).trim().charAt(0).toUpperCase();
  }

  // ── Cargar alumnos desde API ──────────────────────────────────────────────
  async function cargar() {
    try {
      const r = await Api.alumnos.listar();
      if (!r) return;
      _todos     = r.data;
      _filtrados = [..._todos];
      _pagina    = 1;
      _renderTabla();
      _actualizarStats();
    } catch {
      _toast('Error al cargar alumnos', 'error');
    }
  }

  // ── Render tabla con paginación ───────────────────────────────────────────
  function _renderTabla() {
    const tbody   = document.getElementById('tbodyAlumnos');
    const total   = _filtrados.length;
    const totalPag = Math.max(1, Math.ceil(total / POR_PAGINA));

    if (_pagina > totalPag) _pagina = totalPag;

    const inicio  = (_pagina - 1) * POR_PAGINA;
    const lista   = _filtrados.slice(inicio, inicio + POR_PAGINA);

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay alumnos que mostrar</td></tr>';
    } else {
      tbody.innerHTML = lista.map(a => `
        <tr>
          <td><span class="row-id">${a.id}</span></td>
          <td>
            <div class="row-name">
              <div class="row-avatar">${inicial(a.nombre)}</div>
              <a class="row-name-link" href="/alumno.html?id=${a.id}" title="Ver detalle y calificaciones">
                <strong>${esc(a.nombre)}</strong>
              </a>
            </div>
          </td>
          <td><span class="group-badge">${esc(a.grupo)}</span></td>
          <td>${a.email    ? esc(a.email)    : '<span class="muted-dash">—</span>'}</td>
          <td>${a.telefono ? esc(a.telefono) : '<span class="muted-dash">—</span>'}</td>
          <td>
            <div class="actions-cell">
              <a class="btn-icon btn-view" href="/alumno.html?id=${a.id}">Ver detalle</a>
              <button class="btn-icon btn-edit"   onclick="AlumnosModule.abrirEditar(${a.id})">Editar</button>
              <button class="btn-icon btn-delete" onclick="AlumnosModule.confirmarEliminar(${a.id}, '${esc(a.nombre)}')">Eliminar</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    _renderPaginacion(total, totalPag);
  }

  function _renderPaginacion(total, totalPag) {
    const wrap  = document.getElementById('paginacion');
    const info  = document.getElementById('pageInfo');
    const prev  = document.getElementById('btnPrevPage');
    const next  = document.getElementById('btnNextPage');
    const countEl = document.getElementById('resultadoCount');

    if (countEl) countEl.textContent = `${total} alumno${total !== 1 ? 's' : ''}`;
    if (info)  info.textContent  = `Página ${_pagina} de ${totalPag}`;
    if (prev)  prev.disabled = _pagina <= 1;
    if (next)  next.disabled = _pagina >= totalPag;

    if (wrap) wrap.style.display = totalPag <= 1 && total <= POR_PAGINA ? 'none' : 'flex';
  }

  // ── Stats del dashboard ───────────────────────────────────────────────────
  function _actualizarStats() {
    const grupos   = new Set(_todos.map(a => a.grupo));
    const elTotal  = document.getElementById('totalAlumnos');
    const elGrupos = document.getElementById('totalGrupos');
    if (elTotal)  elTotal.textContent  = _todos.length;
    if (elGrupos) elGrupos.textContent = grupos.size;
    updateSettingsStats(_todos.length, grupos.size);

    // Alumnos registrados este mes (calculado en cliente)
    const ahora    = new Date();
    const esteMes  = _todos.filter(a => {
      const d = new Date(a.created_at);
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    }).length;
    const elEsteMes = document.getElementById('alumnosEsteMes');
    if (elEsteMes) elEsteMes.textContent = esteMes;

    // Promedio general vía API
    Api.alumnos.stats().then(r => {
      if (!r || !r.ok) return;
      const el = document.getElementById('promedioGeneral');
      if (el) el.textContent = r.data.promedioGeneral !== null ? r.data.promedioGeneral : '—';
    });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  function buscar(q) {
    const term = q.toLowerCase().trim();
    _filtrados = term
      ? _todos.filter(a =>
          a.nombre.toLowerCase().includes(term) ||
          a.grupo.toLowerCase().includes(term)  ||
          (a.email || '').toLowerCase().includes(term))
      : [..._todos];
    _pagina = 1;
    _renderTabla();
  }

  // ── Paginación ────────────────────────────────────────────────────────────
  function paginaSig()  { _pagina++; _renderTabla(); }
  function paginaAnt()  { _pagina--; _renderTabla(); }

  // ── Modal alumno (crear / editar) ─────────────────────────────────────────
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

  async function abrirEditar(id) {
    try {
      const r = await Api.alumnos.obtener(id);
      if (!r || !r.ok) { _toast('Error al obtener datos del alumno', 'error'); return; }
      const d = r.data;
      document.getElementById('alumnoId').value       = d.id;
      document.getElementById('alumnoNombre').value   = d.nombre;
      document.getElementById('alumnoGrupo').value    = d.grupo;
      document.getElementById('alumnoEmail').value    = d.email    || '';
      document.getElementById('alumnoTelefono').value = d.telefono || '';
      abrirModal('Editar Alumno');
    } catch {
      _toast('Error al obtener datos del alumno', 'error');
    }
  }

  async function guardar(e) {
    e.preventDefault();
    const errorEl  = document.getElementById('formError');
    errorEl.classList.add('hidden');

    const id       = document.getElementById('alumnoId').value;
    const nombre   = document.getElementById('alumnoNombre').value.trim();
    const grupo    = document.getElementById('alumnoGrupo').value.trim();
    const email    = document.getElementById('alumnoEmail').value.trim();
    const telefono = document.getElementById('alumnoTelefono').value.trim();

    try {
      const r = id
        ? await Api.alumnos.actualizar(id, { nombre, grupo, email, telefono })
        : await Api.alumnos.crear({ nombre, grupo, email, telefono });

      if (!r) return;
      if (!r.ok) {
        errorEl.textContent = r.data.error || 'Error desconocido';
        errorEl.classList.remove('hidden');
        return;
      }
      cerrarModal();
      _toast(id ? 'Alumno actualizado' : 'Alumno creado', 'success');
      cargar();
    } catch {
      errorEl.textContent = 'Error de conexión';
      errorEl.classList.remove('hidden');
    }
  }

  // ── Modal confirmar eliminar ───────────────────────────────────────────────
  let _idEliminar = null;

  function confirmarEliminar(id, nombre) {
    _idEliminar = id;
    document.getElementById('nombreEliminar').textContent = nombre;
    document.getElementById('modalEliminar').classList.remove('hidden');
  }

  function cerrarEliminar() {
    document.getElementById('modalEliminar').classList.add('hidden');
    _idEliminar = null;
  }

  async function ejecutarEliminar() {
    if (!_idEliminar) return;
    try {
      const r = await Api.alumnos.eliminar(_idEliminar);
      if (!r || !r.ok) { _toast('Error al eliminar', 'error'); return; }
      cerrarEliminar();
      _toast('Alumno eliminado', 'success');
      cargar();
    } catch {
      _toast('Error de conexión', 'error');
    }
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  function exportarCSV() {
    window.location.href = '/api/alumnos/export/csv';
  }

  // ── Init: conecta todos los eventos del DOM ───────────────────────────────
  function init(toast) {
    _toast = toast;

    // Botón nuevo alumno
    document.getElementById('btnNuevoAlumno')
      .addEventListener('click', () => abrirModal('Nuevo Alumno'));

    // Cerrar modales
    document.getElementById('cerrarModal')
      .addEventListener('click', cerrarModal);
    document.getElementById('cancelarModal')
      .addEventListener('click', cerrarModal);
    document.querySelector('#modalAlumno .modal-overlay')
      .addEventListener('click', cerrarModal);

    // Guardar form
    document.getElementById('formAlumno')
      .addEventListener('submit', guardar);

    // Eliminar
    document.getElementById('cerrarEliminar')
      .addEventListener('click', cerrarEliminar);
    document.getElementById('cancelarEliminar')
      .addEventListener('click', cerrarEliminar);
    document.querySelector('#modalEliminar .modal-overlay')
      .addEventListener('click', cerrarEliminar);
    document.getElementById('confirmarEliminar')
      .addEventListener('click', ejecutarEliminar);

    // Búsqueda
    document.getElementById('searchInput')
      .addEventListener('input', e => buscar(e.target.value));

    // Paginación
    document.getElementById('btnPrevPage')
      .addEventListener('click', paginaAnt);
    document.getElementById('btnNextPage')
      .addEventListener('click', paginaSig);

    // Exportar CSV
    document.getElementById('btnExportCSV')
      .addEventListener('click', exportarCSV);

    cargar();
  }

  // ── API pública del módulo ────────────────────────────────────────────────
  return { init, cargar, abrirEditar, confirmarEliminar };

})();
