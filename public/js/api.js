// ─── api.js — Capa de abstraccion de la API ───────────────────────────────────
const Api = (() => {

  async function request(method, path, body = null) {
    const opts = { method };
    if (body instanceof FormData) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      if (body !== null) opts.body = JSON.stringify(body);
    }

    const res  = await fetch(path, opts);

    if (res.status === 401) {
      window.location.href = '/login.html';
      return null;
    }

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  // Sin redireccion en 401 — para paginas publicas
  async function publicRequest(method, path, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== null) opts.body = JSON.stringify(body);

    try {
      const res  = await fetch(path, opts);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: {} };
    }
  }

  // ── Sesion ────────────────────────────────────────────────────────────────
  const sesion        = ()    => request('GET', '/api/sesion');
  const sesionPublica = ()    => publicRequest('GET', '/api/sesion');
  const logout        = ()    => request('GET', '/api/logout');

  // ── Servicios ─────────────────────────────────────────────────────────────
  const servicios = {
    stats:      ()         => request('GET',    '/api/servicios/stats'),
    listar:     ()         => publicRequest('GET', '/api/servicios'),
    obtener:    (id)       => publicRequest('GET', `/api/servicios/${id}`),
    propios:    ()         => request('GET',    '/api/servicios/propios'),
    crear:      (body)     => request('POST',   '/api/servicios', body),
    actualizar: (id, body) => request('PUT',    `/api/servicios/${id}`, body),
    eliminar:   (id)       => request('DELETE', `/api/servicios/${id}`),
  };

  // ── Artistas (publico) ────────────────────────────────────────────────────
  const artistas = {
    obtener: (id) => publicRequest('GET', `/api/artistas/${id}`),
  };

  // ── Pedidos ───────────────────────────────────────────────────────────────
  const pedidos = {
    listar:    ()         => request('GET',    '/api/pedidos'),
    ventas:    ()         => request('GET',    '/api/pedidos/mis-ventas'),
    compras:   ()         => request('GET',    '/api/pedidos/mis-compras'),
    crear:     (body)     => request('POST',   '/api/pedidos', body),
    actualizar:(id, body) => request('PUT',    `/api/pedidos/${id}`, body),
    eliminar:  (id)       => request('DELETE', `/api/pedidos/${id}`),
  };

  // ── Noticias (Vallecardo) ─────────────────────────────────────────────────
  const noticias = {
    listar:     ()         => publicRequest('GET', '/api/noticias'),
    obtener:    (id)       => publicRequest('GET', `/api/noticias/${id}`),
    crear:      (body)     => request('POST',   '/api/noticias', body),
    actualizar: (id, body) => request('PUT',    `/api/noticias/${id}`, body),
    eliminar:   (id)       => request('DELETE', `/api/noticias/${id}`),
  };

  // ── Mensajería ────────────────────────────────────────────────────────────
  const mensajes = {
    listar: (pedidoId)       => request('GET',  `/api/mensajes/${pedidoId}`),
    enviar: (pedidoId, body) => request('POST', `/api/mensajes/${pedidoId}`, body),
  };

  return { sesion, sesionPublica, logout, servicios, artistas, pedidos, noticias, mensajes };
})();
