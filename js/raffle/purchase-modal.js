// Flujo de reserva de números: se dispara desde el botón "Reservar" de la
// barra flotante y reusa el modal genérico (common/modal.js) en 3 pasos.
document.addEventListener('DOMContentLoaded', () => {
  const floatBarBtn = document.getElementById('float-bar-btn')
  if (!floatBarBtn) return

  let formData = { firstName: '', lastName: '', dni: '', address: '', whatsapp: '' }
  let fileName = ''

  floatBarBtn.addEventListener('click', () => {
    if (selectedNumbers.length === 0) return
    formData = { firstName: '', lastName: '', dni: '', address: '', whatsapp: '' }
    fileName = ''
    showFormStep()
  })

  function resetAfterClose() {
    formData = { firstName: '', lastName: '', dni: '', address: '', whatsapp: '' }
    fileName = ''
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
            <input id="pf-firstName" required value="${formData.firstName}" />
          </label>
          <label class="field">
            <span>Apellido</span>
            <input id="pf-lastName" required value="${formData.lastName}" />
          </label>
          <label class="field">
            <span>CUIL / DNI</span>
            <input id="pf-dni" required value="${formData.dni}" />
          </label>
          <label class="field">
            <span>WhatsApp</span>
            <input id="pf-whatsapp" required value="${formData.whatsapp}" />
          </label>
          <label class="field field--full">
            <span>Dirección</span>
            <input id="pf-address" required value="${formData.address}" />
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-block">Continuar con el pago</button>
      </form>
    `
    Modal.open(`Reservar ${selectedNumbers.length} número(s)`, html, resetAfterClose)

    document.getElementById('purchase-form-step').addEventListener('submit', (e) => {
      e.preventDefault()
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
    const holdMinutes = currentRaffle.holdMinutes || 15
    const holdLabel = holdMinutes >= 60 ? '1 hora' : holdMinutes + ' minutos'

    const html = `
      <form class="purchase-form" id="purchase-payment-step">
        <p class="purchase-hold-note">
          Tus números quedan reservados por ${holdLabel}. Transferí y subí el comprobante antes de que se liberen.
        </p>

        <div class="bank-box">
          <div class="bank-box__row"><span>Banco</span><strong>${bank.bank}</strong></div>
          <div class="bank-box__row"><span>Titular</span><strong>${bank.holder}</strong></div>
          <div class="bank-box__row"><span>CBU</span><strong>${bank.cbu}</strong></div>
          <div class="bank-box__row"><span>Alias</span><strong>${bank.alias}</strong></div>
          <div class="bank-box__row bank-box__row--total">
            <span>Monto a transferir</span><strong>$${total.toLocaleString('es-AR')}</strong>
          </div>
        </div>

        <div class="field">
          <span>Comprobante de transferencia</span>
          <label class="upload-btn">
            <input type="file" id="pf-receipt" accept="image/*,application/pdf" required class="upload-btn__input" />
            ${Icons.upload} Subir comprobante
          </label>
          <span class="file-field__name" id="pf-receipt-name"></span>
        </div>

        <div class="purchase-actions">
          <button type="button" class="btn btn-secondary" id="pf-back-btn">Volver</button>
          <button type="submit" class="btn btn-primary">Enviar reserva</button>
        </div>
      </form>
    `
    Modal.open(`Reservar ${selectedNumbers.length} número(s)`, html, resetAfterClose)

    document.getElementById('pf-receipt').addEventListener('change', (e) => {
      fileName = e.target.files && e.target.files[0] ? e.target.files[0].name : ''
      document.getElementById('pf-receipt-name').textContent = fileName
    })

    document.getElementById('pf-back-btn').addEventListener('click', showFormStep)

    document.getElementById('purchase-payment-step').addEventListener('submit', (e) => {
      e.preventDefault()
      showConfirmedStep()
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
          ${numbersLabel}. En cuanto valide tu comprobante, tu boleto queda confirmado.
        </p>
        <button class="btn btn-primary" id="pf-done-btn">Listo</button>
      </div>
    `
    Modal.open('Reserva enviada', html)

    document.getElementById('pf-done-btn').addEventListener('click', () => {
      Modal.close()
      selectedNumbers = []
      resetAfterClose()
      if (window.renderGrid) window.renderGrid()
      if (window.updateFloatBar) window.updateFloatBar()
    })
  }
})
