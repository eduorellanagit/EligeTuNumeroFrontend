// Flujo de reserva de números: se dispara desde el botón "Reservar" de la
// barra flotante y reusa el modal genérico (common/modal.js) en 3 pasos.
// Al final manda los datos y el comprobante al backend (POST /rifas/{id}/reservar).
document.addEventListener('DOMContentLoaded', () => {
  const floatBarBtn = document.getElementById('float-bar-btn')
  if (!floatBarBtn) return

  const MAX_RECEIPT_MB = 8

  let formData = { firstName: '', lastName: '', dni: '', address: '', whatsapp: '' }
  let receiptFile = null
  let adultConfirmed = false

  floatBarBtn.addEventListener('click', () => {
    if (selectedNumbers.length === 0 || !isRaffleActive()) return
    formData = { firstName: '', lastName: '', dni: '', address: '', whatsapp: '' }
    receiptFile = null
    adultConfirmed = false
    showFormStep()
  })

  function resetAfterClose() {
    formData = { firstName: '', lastName: '', dni: '', address: '', whatsapp: '' }
    receiptFile = null
    adultConfirmed = false
    selectedNumbers = []
    if (window.renderGrid) window.renderGrid()
    if (window.updateFloatBar) window.updateFloatBar()
  }

  function showFormStep() {
    const html = `
      <form class="purchase-form" id="purchase-form-step">
        <div class="purchase-summary">
          Números elegidos: <strong>${selectedNumbers.join(', ')}</strong>
        </div>

        <div class="purchase-grid">
          <label class="field">
            <span>Nombre</span>
            <input id="pf-firstName" required maxlength="120" placeholder="Ej: María" value="${escapeHtml(formData.firstName)}" />
          </label>
          <label class="field">
            <span>Apellido</span>
            <input id="pf-lastName" required maxlength="120" placeholder="Ej: González" value="${escapeHtml(formData.lastName)}" />
          </label>
          <label class="field">
            <span>CUIL / DNI</span>
            <input id="pf-dni" required inputmode="numeric" maxlength="8" placeholder="Ej: 34567890" value="${escapeHtml(formData.dni)}" />
          </label>
          <label class="field">
            <span>WhatsApp</span>
            <input id="pf-whatsapp" required maxlength="30" placeholder="Ej: 3813401680" value="${escapeHtml(formData.whatsapp)}" />
          </label>
          <label class="field field--full">
            <span>Dirección</span>
            <input id="pf-address" required maxlength="100" placeholder="Ej: Av. Belgrano 1234, San Miguel de Tucumán" value="${escapeHtml(formData.address)}" />
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-block">Continuar con el pago</button>
      </form>
    `
    Modal.open(`Reservar ${selectedNumbers.length} número(s)`, html, resetAfterClose)

    document.getElementById('purchase-form-step').addEventListener('submit', (e) => {
      e.preventDefault()
      const fieldError =
        Validate.personName(document.getElementById('pf-firstName').value, 'el nombre') ||
        Validate.personName(document.getElementById('pf-lastName').value, 'el apellido') ||
        Validate.dni(document.getElementById('pf-dni').value) ||
        Validate.whatsapp(document.getElementById('pf-whatsapp').value) ||
        Validate.address(document.getElementById('pf-address').value)
      if (fieldError) {
        ErrorModal.open({ status: 400, message: fieldError })
        return
      }
      formData = {
        firstName: document.getElementById('pf-firstName').value,
        lastName: document.getElementById('pf-lastName').value,
        dni: document.getElementById('pf-dni').value,
        whatsapp: document.getElementById('pf-whatsapp').value,
        address: document.getElementById('pf-address').value,
      }
      showPaymentStep()
    })
  }

  function showPaymentStep() {
    const total = selectedNumbers.length * currentRaffle.pricePerNumber
    const bank = currentRaffle.bankDetails

    const html = `
      <form class="purchase-form" id="purchase-payment-step">
        <p class="purchase-hold-note">
          Tus números quedan reservados hasta que el organizador valide tu pago.
        </p>

        <div class="bank-box">
          <div class="bank-box__row"><span>Banco</span><strong>${escapeHtml(bank.bank)}</strong></div>
          <div class="bank-box__row"><span>Titular</span><strong>${escapeHtml(bank.holder)}</strong></div>
          <div class="bank-box__row"><span>CBU</span><strong>${escapeHtml(bank.cbu)}</strong></div>
          <div class="bank-box__row"><span>Alias</span><strong>${escapeHtml(bank.alias)}</strong></div>
          <div class="bank-box__row bank-box__row--total">
            <span>Monto a transferir</span><strong>$${total.toLocaleString('es-AR')}</strong>
          </div>
        </div>

        <div class="field">
          <span>Comprobante de transferencia</span>
          <label class="upload-btn">
            <input type="file" id="pf-receipt" accept="image/*,application/pdf" class="upload-btn__input" />
            ${Icons.upload} ${receiptFile ? 'Cambiar comprobante' : 'Subir comprobante'}
          </label>
          <span class="file-field__name" id="pf-receipt-name">${escapeHtml(receiptFile ? receiptFile.name : '')}</span>
        </div>

        <label class="checkbox-field">
          <input type="checkbox" id="pf-adult" ${adultConfirmed ? 'checked' : ''} />
          <span>Confirmo que soy mayor de edad</span>
        </label>

        <p class="purchase-error" id="pf-error"></p>

        <div class="purchase-actions">
          <button type="button" class="btn btn-secondary" id="pf-back-btn">Volver</button>
          <button type="submit" class="btn btn-primary" id="pf-submit-btn">Enviar reserva</button>
        </div>
      </form>
    `
    Modal.open(`Reservar ${selectedNumbers.length} número(s)`, html, resetAfterClose)

    const errorEl = document.getElementById('pf-error')
    const submitBtn = document.getElementById('pf-submit-btn')
    const backBtn = document.getElementById('pf-back-btn')

    function showError(message) {
      errorEl.textContent = message
      errorEl.classList.add('is-visible')
    }

    document.getElementById('pf-receipt').addEventListener('change', (e) => {
      receiptFile = e.target.files && e.target.files[0] ? e.target.files[0] : null
      document.getElementById('pf-receipt-name').textContent = receiptFile ? receiptFile.name : ''
      errorEl.classList.remove('is-visible')
    })

    document.getElementById('pf-adult').addEventListener('change', (e) => {
      adultConfirmed = e.target.checked
      errorEl.classList.remove('is-visible')
    })

    backBtn.addEventListener('click', showFormStep)

    document.getElementById('purchase-payment-step').addEventListener('submit', async (e) => {
      e.preventDefault()
      errorEl.classList.remove('is-visible')

      if (!receiptFile) {
        showError('Subí el comprobante de la transferencia para enviar la reserva.')
        return
      }
      if (receiptFile.size > MAX_RECEIPT_MB * 1024 * 1024) {
        showError(`El comprobante pesa demasiado (máximo ${MAX_RECEIPT_MB} MB).`)
        return
      }

      if (!adultConfirmed) {
        showError('Confirmá que sos mayor de edad para enviar la reserva.')
        return
      }

      submitBtn.disabled = true
      backBtn.disabled = true
      submitBtn.textContent = 'Enviando...'

      // Pantalla de carga hasta que aparezca el modal con la respuesta.
      const sendingEl = document.createElement('div')
      sendingEl.className = 'page-loader page-loader--action'
      sendingEl.setAttribute('role', 'status')
      sendingEl.innerHTML = '<div class="page-loader__spinner" aria-hidden="true"></div><p class="page-loader__text">Enviando tu reserva...</p>'
      document.body.appendChild(sendingEl)

      try {
        await Api.reserve(
          currentRaffle.id,
          {
            numeros: [...selectedNumbers].sort((a, b) => a - b),
            nombre: formData.firstName.trim(),
            apellido: formData.lastName.trim(),
            dni: formData.dni.trim(),
            whatsapp: formData.whatsapp.trim(),
            direccion: formData.address.trim(),
          },
          receiptFile
        )
        showConfirmedStep()
        // La grilla pasa a mostrar esos números como reservados.
        if (window.reloadRaffle) window.reloadRaffle()
      } catch (err) {
        submitBtn.disabled = false
        backBtn.disabled = false
        submitBtn.textContent = 'Enviar reserva'

        // Los fallos de la API los explica la ventana de error (js/api.js).
        if (err.status === 409 || err.status === 404) {
          // Alguien se adelantó o la rifa cambió: se actualiza la grilla de fondo.
          showError('Cerrá esta ventana y elegí otros números.')
          if (window.reloadRaffle) window.reloadRaffle()
        } else if (!(err instanceof ApiError)) {
          showError(err.message)
        }
      } finally {
        sendingEl.remove()
      }
    })
  }

  function showConfirmedStep() {
    const numbersLabel = selectedNumbers.join(', ')
    const html = `
      <div class="purchase-confirmed">
        <div class="purchase-confirmed__icon">${Icons.check}</div>
        <h4>Solicitud enviada</h4>
        <p>
          Le avisamos al organizador que reservaste el número${selectedNumbers.length > 1 ? 's' : ''}
          ${escapeHtml(numbersLabel)}. En cuanto valide tu comprobante, tu boleto queda confirmado.
        </p>
        <div class="detail-actions detail-actions--equal">
          <button class="btn btn-secondary" id="pf-close-btn" type="button">Cerrar</button>
          <button class="btn btn-primary" id="pf-done-btn" type="button">Continuar</button>
        </div>
      </div>
    `
    // Al cerrarse (con los botones o de cualquier otra forma) se limpia la selección.
    Modal.open('Reserva enviada', html, resetAfterClose)

    document.getElementById('pf-close-btn').addEventListener('click', () => Modal.close())
    document.getElementById('pf-done-btn').addEventListener('click', () => Modal.close())
  }
})
