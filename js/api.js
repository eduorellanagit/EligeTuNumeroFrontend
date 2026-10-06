// Cliente del backend. Todas las pantallas le hablan al servidor a través de acá:
// un solo lugar para armar las URLs, mandar el token, y traducir los errores a
// mensajes en español.
//
// Requiere js/config.js (API_BASE_URL) y js/auth/session.js (token), cargados antes.

// ---------------------------------------------------------------------------
// Utilidades para pintar datos que vienen del servidor
// ---------------------------------------------------------------------------

// Todo lo que escribe una persona (títulos, nombres, direcciones...) tiene que pasar por
// acá antes de meterlo en un innerHTML; si no, alguien podría colar HTML o scripts.
function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Devuelve la URL solo si es http(s); si no (por ejemplo "javascript:...") devuelve ''.
function safeUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url, window.location.href)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : ''
  } catch (e) {
    return ''
  }
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// El backend responde con códigos HTTP; acá se traducen a algo que entienda una persona.
// Si el servidor mandó un detalle propio (400 y 409), se usa ese.
function friendlyMessage(status, detail) {
  const clean = typeof detail === 'string' ? detail.trim() : ''
  switch (status) {
    case 0:
      return 'No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.'
    case 400:
      return clean || 'Revisá los datos ingresados e intentá de nuevo.'
    case 401:
      return 'Tu sesión venció. Iniciá sesión de nuevo.'
    case 402:
      return 'No tenés créditos suficientes. Comprá un paquete e intentá de nuevo.'
    case 403:
      return 'No tenés permiso para hacer esto.'
    case 404:
      return clean || 'No encontramos lo que buscabas.'
    case 409:
      return clean || 'Algo cambió mientras tanto y la acción ya no es posible. Actualizá la página e intentá de nuevo.'
    case 413:
      return 'El archivo es demasiado pesado (máximo 8 MB).'
    case 415:
      return 'Ese tipo de archivo no está permitido.'
    case 502:
      return 'No pudimos comunicarnos con Mercado Pago. Probá de nuevo en un rato.'
    default:
      return status >= 500
        ? 'Algo salió mal de nuestro lado. Probá de nuevo en unos minutos.'
        : clean || 'No se pudo completar la acción.'
  }
}

// ---------------------------------------------------------------------------
// Petición genérica
// ---------------------------------------------------------------------------

// Los túneles gratuitos de ngrok interceptan las peticiones del navegador con una página de
// aviso (HTML), y eso rompe los fetch. Este header la saltea. Solo se manda si la API está en
// ngrok, así que en producción (dominio propio) no se agrega nada.
function tunnelHeaders() {
  return /ngrok/i.test(API_BASE_URL) ? { 'ngrok-skip-browser-warning': 'true' } : {}
}

// options: { method, body (objeto → JSON), formData, auth (true = manda el token) }
async function apiRequest(path, options) {
  const { method = 'GET', body, formData, auth = false } = options || {}
  const headers = { ...tunnelHeaders() }

  if (auth) {
    const token = getAuthToken()
    if (!token) {
      logoutAndRedirect()
      throw new ApiError(401, friendlyMessage(401))
    }
    headers.Authorization = 'Bearer ' + token
  }

  let payload
  if (formData) {
    // Con FormData NO se pone Content-Type a mano: el navegador agrega el boundary solo.
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(API_BASE_URL + path, { method, headers, body: payload })
  } catch (e) {
    throw new ApiError(0, friendlyMessage(0))
  }

  if (!response.ok) {
    // Token vencido o inválido: se borra la sesión y se vuelve al login.
    if (auth && response.status === 401) {
      logoutAndRedirect('expired=1')
    }

    let detail = ''
    try {
      const data = await response.json()
      detail = data.detail || data.message || ''
    } catch (e) {
      // la respuesta no traía JSON; se usa el mensaje por defecto del código
    }
    throw new ApiError(response.status, friendlyMessage(response.status, detail))
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

// ---------------------------------------------------------------------------
// Endpoints (uno por función, con el mismo nombre que usa el resto del código)
// ---------------------------------------------------------------------------

const Api = {
  // --- Usuario
  getMe: () => apiRequest('/usuarios/me', { auth: true }),
  updateProfile: (data) => apiRequest('/usuarios/me/perfil', { method: 'PUT', body: data, auth: true }),

  // --- Rifas del creador
  getMyRaffles: () => apiRequest('/rifas/me', { auth: true }),
  createRaffle: (data) => apiRequest('/rifas', { method: 'POST', body: data, auth: true }),
  closeRaffle: (raffleSlug) =>
    apiRequest('/rifas/' + encodeURIComponent(raffleSlug) + '/cerrar', { method: 'POST', auth: true }),

  uploadPrizeImage: (file) => {
    const form = new FormData()
    form.append('archivo', file, file.name || 'premio.jpg')
    return apiRequest('/rifas/imagen', { method: 'POST', formData: form, auth: true })
  },

  // --- Página pública de una rifa y reserva de números (no necesitan sesión)
  getPublicRaffle: (ownerSlug, raffleSlug) =>
    apiRequest('/rifas/' + encodeURIComponent(ownerSlug) + '/' + encodeURIComponent(raffleSlug)),

  // datos = { numeros, nombre, apellido, dni, whatsapp, direccion }; comprobante = File
  reserve: (raffleId, datos, comprobante) => {
    const form = new FormData()
    form.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }))
    form.append('comprobante', comprobante, comprobante.name)
    return apiRequest('/rifas/' + encodeURIComponent(raffleId) + '/reservar', { method: 'POST', formData: form })
  },

  // --- Validar pagos (estado: PENDIENTE | ACEPTADA | RECHAZADA)
  listReservations: (estado) => apiRequest('/reservas?estado=' + encodeURIComponent(estado), { auth: true }),
  acceptReservation: (id) => apiRequest('/reservas/' + encodeURIComponent(id) + '/aceptar', { method: 'POST', auth: true }),
  rejectReservation: (id) => apiRequest('/reservas/' + encodeURIComponent(id) + '/rechazar', { method: 'POST', auth: true }),

  // --- Créditos: devuelve { id, plan, monto, estado, checkoutUrl } (a checkoutUrl se redirige para pagar)
  buyCredits: (planId) => apiRequest('/creditos/comprar', { method: 'POST', body: { planId }, auth: true }),
}
