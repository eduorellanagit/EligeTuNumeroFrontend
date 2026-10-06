// Botón "Continuar con Google". El inicio de sesión lo hace el backend: acá se navega
// directo a /usuarios/login, que redirige a Google; al terminar, el backend vuelve a
// me.html#token=... (ese token lo captura js/auth/session.js) o a login.html?error=1.
// GitHub todavía no está disponible en el backend, por eso el botón queda deshabilitado.
document.addEventListener('DOMContentLoaded', () => {
  const providerButtons = document.querySelectorAll('.auth-provider-btn')
  const loadingEl = document.getElementById('auth-loading')
  if (providerButtons.length === 0) return

  const params = new URLSearchParams(window.location.search)
  const plan = params.get('plan')

  // Si ya hay sesión, no hace falta volver a loguearse.
  if (getAuthToken()) {
    window.location.replace(plan ? 'me.html?plan=' + encodeURIComponent(plan) : 'me.html')
    return
  }

  function showMessage(text) {
    loadingEl.textContent = text
    loadingEl.classList.add('is-visible')
  }

  if (params.get('error')) showMessage('No pudimos iniciar sesión con Google. Probá de nuevo.')
  else if (params.get('expired')) showMessage('Tu sesión venció. Iniciá sesión de nuevo.')

  providerButtons.forEach((btn) => {
    if (btn.dataset.provider !== 'Google') {
      btn.disabled = true
      return
    }

    btn.addEventListener('click', () => {
      providerButtons.forEach((b) => (b.disabled = true))
      showMessage('Conectando con Google...')

      // El plan elegido en la landing se guarda acá porque el viaje a Google y de vuelta pierde la URL.
      if (plan) sessionStorage.setItem(PENDING_PLAN_KEY, plan)
      else sessionStorage.removeItem(PENDING_PLAN_KEY)

      window.location.href = API_BASE_URL + '/usuarios/login'
    })
  })
})
