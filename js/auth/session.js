// Sesión del creador. Cuando el backend termina el ida y vuelta con Google, redirige
// a me.html#token=xxx (el token va en el fragmento de la URL, que el navegador no
// manda a ningún servidor). Esto lo guarda en localStorage y limpia la URL para que
// el token no quede visible ni en el historial.
//
// Se carga ANTES que js/api.js (que usa estas funciones para mandar el token).
const TOKEN_KEY = 'eligetunumero_token'

// Plan elegido en la landing (login.html?plan=...). Se guarda mientras el usuario va
// y vuelve de Google, porque en ese viaje se pierde el parámetro de la URL.
const PENDING_PLAN_KEY = 'eligetunumero_plan'

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function saveAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Headers listos para pegarle a cualquier endpoint de /api/v1/ que necesite
// sesión. Uso: fetch(url, { headers: { ...authHeaders() } })
function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: 'Bearer ' + token } : {}
}

// Borra la sesión y vuelve al login (por ejemplo, cuando el token venció).
function logoutAndRedirect(query) {
  clearAuthToken()
  window.location.replace('login.html' + (query ? '?' + query : ''))
}

// Si no hay sesión, manda al login. Devuelve true si se puede seguir.
function requireLogin() {
  if (getAuthToken()) return true
  window.location.replace('login.html')
  return false
}

// --- Se ejecuta apenas carga el script ---

;(function captureTokenFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const token = hashParams.get('token')
  if (!token) return

  saveAuthToken(token)
  hashParams.delete('token')
  const remaining = hashParams.toString()
  const cleanUrl = window.location.pathname + window.location.search + (remaining ? '#' + remaining : '')
  window.history.replaceState({}, '', cleanUrl)
})()

// Las páginas que necesitan sesión (el panel) llevan data-requires-auth en el <body>.
if (document.body && document.body.hasAttribute('data-requires-auth')) {
  requireLogin()
}
