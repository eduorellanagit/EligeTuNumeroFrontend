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

// extra (opcional): lo que mandó el backend en su ErrorMessage: { exception } (nombre de la clase,
// sirve para elegir el título de la ventana de error)
class ApiError extends Error {
  constructor(status, message, extra) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    Object.assign(this, extra || {})
  }
}

// Abre la ventana con el detalle del error (js/common/error-modal.js), si la página la trae.
function reportApiError(err) {
  if (typeof ErrorModal !== 'undefined') ErrorModal.open(err)
}

// El mensaje que se muestra es el que manda el backend, tal cual llega (normalmente en español).
// Estos textos propios son solo de respaldo: sirven cuando no hay conexión o cuando el servidor
// no mandó ningún mensaje (por ejemplo una página de error que no es JSON).
function friendlyMessage(status, detail) {
  const clean = typeof detail === 'string' ? detail.trim() : ''
  // Errores del servidor (5xx): nunca se muestra su texto, puede traer datos internos.
  if (status >= 500) {
    return status === 502
      ? 'No pudimos comunicarnos con Mercado Pago. Probá de nuevo en un rato.'
      : 'Algo salió mal de nuestro lado. Probá de nuevo en unos minutos.'
  }
  if (clean) return clean
  switch (status) {
    case 0:
      return 'No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.'
    case 400:
      return 'Revisá los datos ingresados e intentá de nuevo.'
    case 401:
      return 'Tu sesión venció. Iniciá sesión de nuevo.'
    case 402:
      return 'No tenés créditos suficientes. Comprá un paquete e intentá de nuevo.'
    case 403:
      return 'No tenés permiso para hacer esto.'
    case 404:
      return 'No encontramos lo que buscabas.'
    case 409:
      return 'Algo cambió mientras tanto y la acción ya no es posible. Actualizá la página e intentá de nuevo.'
    case 413:
      return 'El archivo es demasiado pesado (máximo 8 MB).'
    case 415:
      return 'Ese tipo de archivo no está permitido.'
    default:
      return 'No se pudo completar la acción.'
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

// options: { method, body (objeto → JSON), formData, auth (true = manda el token),
//            silent (true = no abre la ventana de error: la pantalla ya muestra el fallo ella misma) }
async function apiRequest(path, options) {
  const { method = 'GET', body, formData, auth = false, silent = false } = options || {}
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
    const offline = new ApiError(0, friendlyMessage(0))
    if (!silent) reportApiError(offline)
    throw offline
  }

  if (!response.ok) {
    // Token vencido o inválido: se borra la sesión y se vuelve al login (sin ventana de error).
    const sessionExpired = auth && response.status === 401
    if (sessionExpired) {
      logoutAndRedirect('expired=1')
    }

    let detail = ''
    let extra = {}
    try {
      const data = await response.json()
      detail = data.detail || data.message || ''
      extra = { exception: data.exception || '' }
    } catch (e) {
      // la respuesta no traía JSON; se usa el mensaje de respaldo del código
    }

    // Errores de validación (@Valid): el "message" del backend es un texto técnico de Spring, así
    // que se muestra un mensaje corto.
    if (extra.exception === 'MethodArgumentNotValidException') {
      detail = 'Hay datos que no son válidos. Revisá lo que ingresaste e intentá de nuevo.'
    }
    // Archivo que supera el límite de subida: el mensaje lo arma Spring (en inglés), no el backend.
    // Se usa el texto propio de respaldo para el 413.
    if (extra.exception === 'MaxUploadSizeExceededException') {
      detail = ''
    }

    const apiError = new ApiError(response.status, friendlyMessage(response.status, detail), extra)
    if (!silent && !sessionExpired) reportApiError(apiError)
    throw apiError
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
  closeRaffle: (raffleId) =>
    apiRequest('/rifas/' + encodeURIComponent(raffleId) + '/cerrar', { method: 'POST', auth: true }),

  uploadPrizeImage: (file) => {
    const form = new FormData()
    form.append('archivo', file, file.name || 'premio.jpg')
    return apiRequest('/rifas/imagen', { method: 'POST', formData: form, auth: true })
  },

  // --- Página pública de una rifa y reserva de números (no necesitan sesión)
  getPublicRaffle: (ownerSlug, raffleId) =>
    apiRequest('/rifas/' + encodeURIComponent(ownerSlug) + '/' + encodeURIComponent(raffleId), { silent: true }),

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

  // --- Datos de la cuenta ("Pedir mis datos")
  getMyData: () => apiRequest('/usuarios/me/data', { auth: true }),
  // Desactiva la cuenta (el backend no devuelve nada).
  deactivateAccount: () => apiRequest('/usuarios/me/desactivar', { method: 'POST', auth: true }),

  // --- Solicitudes (/requests): soporte, devolución de créditos y panel de control (solo soporte).
  //     createRequest recibe { requestsType, description } (description: de 10 a 500 caracteres).
  createRequest: (data) => apiRequest('/requests/request', { method: 'POST', body: data, auth: true }),
  requestCreditRefund: () => apiRequest('/requests/devolucion', { method: 'POST', auth: true }),
  listRequestsByStatus: (status) =>
    apiRequest('/requests/request/' + encodeURIComponent(status), { auth: true }),
  listAllRequests: () => apiRequest('/requests/all', { auth: true }),
  markRequestReviewed: (id) =>
    apiRequest('/requests/update/' + encodeURIComponent(id), { method: 'PUT', auth: true }),

  // --- Créditos: devuelve { id, plan, monto, estado, checkoutUrl } (a checkoutUrl se redirige para pagar)
  buyCredits: (planId) => apiRequest('/creditos/comprar', { method: 'POST', body: { planId }, auth: true }),
}
