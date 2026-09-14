// Botones de "Continuar con Google/GitHub". En DEMO_MODE (ver js/config.js)
// se simula el ida y vuelta OAuth2 con un estado de carga y se redirige al
// panel. Con el backend real, en cambio, se navega directo al endpoint de
// autenticación de Spring Security, que hace el intercambio OAuth2 de
// verdad y termina redirigiendo a me.html con un token.
document.addEventListener('DOMContentLoaded', () => {
  const providerButtons = document.querySelectorAll('.auth-provider-btn')
  const loadingEl = document.getElementById('auth-loading')
  if (providerButtons.length === 0) return

  const params = new URLSearchParams(window.location.search)
  const plan = params.get('plan')
  const redirectTarget = plan ? 'me.html?plan=' + encodeURIComponent(plan) : 'me.html'

  providerButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      providerButtons.forEach((b) => (b.disabled = true))
      const provider = btn.dataset.provider
      loadingEl.textContent = 'Conectando con ' + provider + '...'
      loadingEl.classList.add('is-visible')

      if (DEMO_MODE) {
        setTimeout(() => {
          window.location.href = redirectTarget
        }, 700)
        return
      }

      // Backend real: Spring Security se encarga del OAuth2 con Google/GitHub
      // y redirige de vuelta a redirect_uri con ?token=... (lo captura
      // js/auth/session.js). Ver README → "Conectar con el backend real".
      const redirectUri = window.location.origin + window.location.pathname.replace('login.html', '') + redirectTarget
      const authUrl = API_BASE_URL + '/auth/' + provider.toLowerCase() + '?redirect_uri=' + encodeURIComponent(redirectUri)
      window.location.href = authUrl
    })
  })
})
