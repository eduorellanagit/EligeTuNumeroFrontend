// Estado compartido del panel del creador. Los datos salen de GET /usuarios/me y los
// usan varias pantallas (perfil, créditos, crear rifa, links públicos), así que se
// piden una sola vez y se comparten.
//
// Uso: await loadCreatorProfile()          → trae los datos (una sola vez)
//      await loadCreatorProfile(true)      → los vuelve a pedir (por ejemplo, tras comprar créditos)
const creatorProfile = {
  loaded: false,
  slug: '',
  name: '',
  email: '',
  authProvider: '',
  dni: '',
  whatsapp: '',
  cbu: '',
  alias: '',
  accountHolder: '',
  credits: 0,
  profileComplete: false,
}

let creatorProfilePromise = null

function applyCreatorProfile(data) {
  const providerLabels = { GOOGLE: 'Google', GITHUB: 'GitHub' }

  creatorProfile.loaded = true
  creatorProfile.slug = data.slug || ''
  creatorProfile.name = data.nombre || ''
  creatorProfile.email = data.email || ''
  creatorProfile.authProvider = providerLabels[data.authProvider] || data.authProvider || ''
  creatorProfile.dni = data.dni || ''
  creatorProfile.whatsapp = data.whatsapp || ''
  creatorProfile.cbu = data.cbu || ''
  creatorProfile.alias = data.alias || ''
  creatorProfile.accountHolder = data.titularCuenta || ''
  creatorProfile.credits = Number(data.creditos) || 0
  creatorProfile.profileComplete = Boolean(data.perfilCompleto)
  return creatorProfile
}

function loadCreatorProfile(force) {
  if (!creatorProfilePromise || force) {
    creatorProfilePromise = Api.getMe()
      .then(applyCreatorProfile)
      .catch((err) => {
        creatorProfilePromise = null
        throw err
      })
  }
  return creatorProfilePromise
}

// Mensaje de error en una ventana (usa el modal genérico). Sirve para fallos que no tienen
// un lugar propio en la pantalla, como aceptar un pago o cerrar una rifa.
function showErrorModal(message, title) {
  const html = `
    <div class="purchase-confirmed">
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-primary" id="error-modal-ok" style="margin-top: 20px;">Entendido</button>
    </div>
  `
  Modal.open(title || 'Algo salió mal', html)
  document.getElementById('error-modal-ok').addEventListener('click', () => Modal.close())
}
