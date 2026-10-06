// Carga los datos del creador desde el backend en el formulario de perfil y los guarda
// con PUT /usuarios/me/perfil. Si el perfil todavía está incompleto (cuenta nueva),
// abre esta pestaña directamente.
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('profile-form')
  if (!form) return

  const emailField = document.getElementById('profile-readonly-email')
  const providerField = document.getElementById('profile-readonly-provider')
  const nameInput = document.getElementById('profile-name')
  const dniInput = document.getElementById('profile-dni')
  const whatsappInput = document.getElementById('profile-whatsapp')
  const holderInput = document.getElementById('profile-holder')
  const cbuInput = document.getElementById('profile-cbu')
  const aliasInput = document.getElementById('profile-alias')
  const savedNote = document.getElementById('profile-saved-note')
  const errorNote = document.getElementById('profile-error')
  const submitBtn = form.querySelector('button[type="submit"]')

  function showError(message) {
    errorNote.textContent = message
    errorNote.style.display = 'inline'
  }

  function fillForm() {
    emailField.textContent = creatorProfile.email
    providerField.textContent = creatorProfile.authProvider
    nameInput.value = creatorProfile.name
    dniInput.value = creatorProfile.dni
    whatsappInput.value = creatorProfile.whatsapp
    holderInput.value = creatorProfile.accountHolder
    cbuInput.value = creatorProfile.cbu
    aliasInput.value = creatorProfile.alias
  }

  submitBtn.disabled = true
  try {
    await loadCreatorProfile()
  } catch (err) {
    showError(err.message)
    return
  }
  submitBtn.disabled = false
  fillForm()

  // Cuenta nueva: lo primero que necesita es completar sus datos de cobro.
  const comingBackFromPayment = new URLSearchParams(window.location.search).has('pago')
  if (!creatorProfile.profileComplete && !comingBackFromPayment) {
    const profileTab = document.querySelector('.sidebar__tab[data-tab="perfil"]')
    if (profileTab) profileTab.click()
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    savedNote.style.display = 'none'
    errorNote.style.display = 'none'

    // Misma validación que hace el servidor, para avisar antes de enviar.
    const dni = onlyDigits(dniInput.value)
    const cbu = onlyDigits(cbuInput.value)
    const whatsapp = whatsappInput.value.trim()

    if (!/^\d{7,8}$/.test(dni)) {
      showError('El DNI debe tener 7 u 8 dígitos (sin puntos).')
      return
    }
    if (!/^\+?[\d\s()-]{8,30}$/.test(whatsapp)) {
      showError('El WhatsApp no es válido. Ejemplo: +54 9 381 555-1234')
      return
    }
    if (!/^\d{22}$/.test(cbu)) {
      showError('El CBU / CVU debe tener 22 dígitos.')
      return
    }

    submitBtn.disabled = true
    try {
      const saved = await Api.updateProfile({
        nombre: nameInput.value.trim(),
        dni,
        whatsapp,
        cbu,
        alias: aliasInput.value.trim(),
        titularCuenta: holderInput.value.trim(),
      })
      applyCreatorProfile(saved)
      fillForm()

      savedNote.textContent = 'Cambios guardados.'
      savedNote.style.display = 'inline'
      if (window.refreshCreateRaffleCredits) window.refreshCreateRaffleCredits()
    } catch (err) {
      showError(err.message)
    } finally {
      submitBtn.disabled = false
    }
  })

  ;[nameInput, dniInput, whatsappInput, holderInput, cbuInput, aliasInput].forEach((input) => {
    input.addEventListener('input', () => {
      savedNote.style.display = 'none'
      errorNote.style.display = 'none'
    })
  })
})
