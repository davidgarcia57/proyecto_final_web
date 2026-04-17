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
let alumnoData  = {}; // datos del alumno activo (para exportar)

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
  alumnoData = a; // guardar para exportar
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

// ── Exportar Boletín ─────────────────────────────────────────────────────────

// Toggle dropdown
document.getElementById('btnExportarBoletin').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('exportMenu').classList.toggle('hidden');
});
document.addEventListener('click', () => {
  document.getElementById('exportMenu').classList.add('hidden');
});

// ── PDF ──────────────────────────────────────────────────────────────────────
document.getElementById('btnExportPDF').addEventListener('click', () => {
  document.getElementById('exportMenu').classList.add('hidden');

  if (!calActual.length) {
    mostrarToast('No hay calificaciones para exportar', 'error');
    return;
  }
  if (!window.jspdf) {
    mostrarToast('PDF aún cargando, intenta en un momento', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();

  // ── Cabecera ──────────────────────────────────────────────────────────────
  // Barra superior indigo
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(0, 0, W, 32, 0, 0, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('EduGest', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Boletín Oficial de Calificaciones', 14, 21);

  const fechaStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(8.5);
  doc.text(fechaStr, W - 14, 21, { align: 'right' });

  // ── Datos del alumno ──────────────────────────────────────────────────────
  const a = alumnoData;
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(a.nombre || '—', 14, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);

  const meta = [];
  meta.push(`Grupo: ${a.grupo || '—'}`);
  if (a.email)    meta.push(`Email: ${a.email}`);
  if (a.telefono) meta.push(`Tel: ${a.telefono}`);
  meta.push(`ID: #${alumnoId}`);

  doc.text(meta.join('   ·   '), 14, 52);

  // Línea divisora
  doc.setDrawColor(199, 210, 254);
  doc.setLineWidth(0.4);
  doc.line(14, 57, W - 14, 57);

  // ── Tabla de calificaciones ───────────────────────────────────────────────
  const suma  = calActual.reduce((s, c) => s + parseFloat(c.calificacion), 0);
  const prom  = (suma / calActual.length).toFixed(1);

  function colorCalificacion(val) {
    const v = parseFloat(val);
    if (v >= 9)  return [22, 163, 74];
    if (v >= 7)  return [30, 85, 197];
    if (v >= 6)  return [161, 98, 7];
    return [185, 28, 28];
  }

  doc.autoTable({
    startY: 63,
    head: [['Materia', 'Calificación', 'Periodo']],
    body: calActual.map(c => [
      c.materia,
      parseFloat(c.calificacion).toFixed(1),
      c.periodo
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 4.5, right: 6, bottom: 4.5, left: 6 },
      textColor: [30, 27, 75],
      lineColor: [199, 210, 254],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [238, 242, 255],
      textColor: [91, 82, 192],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
    },
    alternateRowStyles: { fillColor: [248, 249, 255] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 38, halign: 'center' },
    },
    didDrawCell(data) {
      // Colorear celda de calificación
      if (data.section === 'body' && data.column.index === 1) {
        const val   = parseFloat(data.cell.raw);
        const [r,g,b] = colorCalificacion(val);
        const cx = data.cell.x + data.cell.width / 2;
        const cy = data.cell.y + data.cell.height / 2;
        doc.setFillColor(r, g, b);
        doc.roundedRect(cx - 10, cy - 4, 20, 8, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(data.cell.raw.toString(), cx, cy + 0.8, { align: 'center' });
        // Evitar que autoTable sobreimprima el texto
        data.cell.text = [];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Promedio general ──────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 8;
  const [pr, pg, pb] = colorCalificacion(prom);

  doc.setFillColor(238, 242, 255);
  doc.roundedRect(14, finalY - 6, W - 28, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(79, 70, 229);
  doc.text('Promedio General', 20, finalY + 2);

  doc.setFillColor(pr, pg, pb);
  doc.roundedRect(W - 50, finalY - 4.5, 32, 11, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(prom, W - 34, finalY + 2.5, { align: 'center' });

  // ── Pie de página ─────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(199, 210, 254);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 16, W - 14, pageH - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Documento generado automáticamente por EduGest', 14, pageH - 10);
  doc.text(fechaStr, W - 14, pageH - 10, { align: 'right' });

  // ── Guardar ───────────────────────────────────────────────────────────────
  const nombreArchivo = `boletin_${(a.nombre || 'alumno').replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
  mostrarToast('PDF generado correctamente', 'success');
});

// ── CSV ───────────────────────────────────────────────────────────────────────
document.getElementById('btnExportCSV').addEventListener('click', () => {
  document.getElementById('exportMenu').classList.add('hidden');
  if (!calActual.length) {
    mostrarToast('No hay calificaciones para exportar', 'error');
    return;
  }
  window.location.href = `/api/calificaciones/alumno/${alumnoId}/export/csv`;
  mostrarToast('Descargando CSV…', 'success');
});

// ── Sidebar toggle (mobile) ───────────────────────────────────────────────────
(function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const toggle   = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  function openSidebar()  { sidebar.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
})();

// ── Arranque ──────────────────────────────────────────────────────────────────
(async () => {
  // Verificar sesión
  const sesRes = await Api.sesion();
  if (!sesRes || !sesRes.data.autenticado) {
    window.location.href = '/login.html';
    return;
  }
  document.body.classList.remove('app-loading');

  const usuario = sesRes.data.usuario;
  populateSettingsProfile(usuario);

  // Topbar user info
  const initial  = usuario.nombre.trim().charAt(0).toUpperCase();
  const avatarEl = document.getElementById('topbarAvatar');
  const nameEl   = document.getElementById('topbarName');
  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl)   nameEl.textContent   = usuario.nombre;

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Api.logout();
    window.location.href = '/login.html';
  });

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
