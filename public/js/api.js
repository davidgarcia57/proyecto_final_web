// ─── api.js — Capa de abstracción de la API ───────────────────────────────────
// Principio D (Dependency Inversion): los módulos de alto nivel (AlumnosModule,
// CalificacionesModule) dependen de esta abstracción, no de fetch() directamente.
// Si la API cambia, sólo se modifica aquí.

const Api = (() => {

  // Función base: centraliza fetch, manejo de 401 y parsing JSON
  async function request(method, path, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== null) opts.body = JSON.stringify(body);

    const res  = await fetch(path, opts);

    if (res.status === 401) {
      window.location.href = '/login.html';
      return null;
    }

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  // ── Sesión ────────────────────────────────────────────────────────────────
  const sesion  = ()    => request('GET', '/api/sesion');
  const logout  = ()    => request('GET', '/api/logout');

  // ── Alumnos ───────────────────────────────────────────────────────────────
  const alumnos = {
    listar:     ()          => request('GET',    '/api/alumnos'),
    stats:      ()          => request('GET',    '/api/alumnos/stats'),
    obtener:    (id)        => request('GET',    `/api/alumnos/${id}`),
    crear:      (body)      => request('POST',   '/api/alumnos', body),
    actualizar: (id, body)  => request('PUT',    `/api/alumnos/${id}`, body),
    eliminar:   (id)        => request('DELETE', `/api/alumnos/${id}`),
  };

  // ── Materias ──────────────────────────────────────────────────────────────
  const materias = {
    listar: () => request('GET', '/api/materias'),
  };

  // ── Calificaciones ────────────────────────────────────────────────────────
  const calificaciones = {
    porAlumno:  (alumnoId)   => request('GET',    `/api/calificaciones/alumno/${alumnoId}`),
    crear:      (body)       => request('POST',   '/api/calificaciones', body),
    actualizar: (id, body)   => request('PUT',    `/api/calificaciones/${id}`, body),
    eliminar:   (id)         => request('DELETE', `/api/calificaciones/${id}`),
  };

  return { sesion, logout, alumnos, materias, calificaciones };
})();
