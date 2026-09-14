// Carga los datos de ejemplo en el formulario de perfil y simula el guardado
// (sin backend todavía, solo feedback visual).
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form')
  if (!form) return

  const emailField = document.getElementById('profile-readonly')
  const nameInput = document.getElementById('profile-name')
  const dniInput = document.getElementById('profile-dni')
  const whatsappInput = document.getElementById('profile-whatsapp')
  const holderInput = document.getElementById('profile-holder')
  const cbuInput = document.getElementById('profile-cbu')
  const aliasInput = document.getElementById('profile-alias')
  const savedNote = document.getElementById('profile-saved-note')

  emailField.textContent = creatorProfile.email + ' · ' + creatorProfile.authProvider
  nameInput.value = creatorProfile.name
  dniInput.value = creatorProfile.dni
  whatsappInput.value = creatorProfile.whatsapp
  holderInput.value = creatorProfile.accountHolder
  cbuInput.value = creatorProfile.cbu
  aliasInput.value = creatorProfile.alias

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    creatorProfile.name = nameInput.value
    creatorProfile.dni = dniInput.value
    creatorProfile.whatsapp = whatsappInput.value
    creatorProfile.accountHolder = holderInput.value
    creatorProfile.cbu = cbuInput.value
    creatorProfile.alias = aliasInput.value

    savedNote.textContent = 'Cambios guardados.'
    savedNote.style.display = 'inline'
  })

  ;[nameInput, dniInput, whatsappInput, holderInput, cbuInput, aliasInput].forEach((input) => {
    input.addEventListener('input', () => {
      savedNote.style.display = 'none'
    })
  })
})
