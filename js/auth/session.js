// Cuando el backend real termina el ida y vuelta de OAuth2, redirige acá con
// un token en la URL (por ejemplo me.html?token=xxx). Esto lo guarda y limpia
// la URL para que el token no quede visible ni en el historial del navegador.
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) return

  localStorage.setItem('rifalo_token', token)
  params.delete('token')
  const cleanQuery = params.toString()
  const cleanUrl = window.location.pathname + (cleanQuery ? '?' + cleanQuery : '')
  window.history.replaceState({}, '', cleanUrl)
})

function getAuthToken() {
  return localStorage.getItem('rifalo_token')
}

// Headers listos para pegarle a cualquier endpoint de /api/v1/ que necesite
// sesión. Uso: fetch(url, { headers: { ...authHeaders(), 'Content-Type': 'application/json' } })
function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: 'Bearer ' + token } : {}
}
