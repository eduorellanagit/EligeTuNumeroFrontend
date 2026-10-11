// Sección "Cuenta y privacidad". Cada botón del HTML trae un data-account-action:
//   export-data      → descarga un JSON con los datos de la cuenta   (GET /usuarios/me/data)
//   refund-credits   → pide la devolución de las compras recientes   (POST /requests/devolucion)
//   contact-support  → envía una solicitud a soporte                 (POST /requests/request)
//   deactivate-account → todavía sin backend: el botón no hace nada
document.addEventListener('DOMContentLoaded', () => {
  // Valores del enum RequestsType del backend. DEVOLUCION no está: tiene su propio botón.
  const SUPPORT_REQUEST_TYPES = [
    { value: 'SOPORTE', label: 'Consulta o ayuda' },
    { value: 'ERROR', label: 'Reportar un error' },
    { value: 'OTRO', label: 'Otro' },
  ]
  const DESCRIPTION_MIN = 10
  const DESCRIPTION_MAX = 500

  function showInfoModal(title, message) {
    Modal.open(
      title,
      `<div class="purchase-confirmed">
        <p>${escapeHtml(message)}</p>
        <button class="btn btn-primary" id="info-modal-ok" style="margin-top: 20px;">Entendido</button>
      </div>`
    )
    document.getElementById('info-modal-ok').addEventListener('click', () => Modal.close())
  }

  // ---- Pedir mis datos: se descarga como archivo .json
  async function exportData(button) {
    const label = button.textContent
    button.disabled = true
    button.textContent = 'Preparando...'
    try {
      const data = await Api.getMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'mis-datos-eligetunumero.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      showInfoModal('Tus datos', 'Descargamos un archivo con los datos de tu cuenta.')
    } catch (err) {
      showErrorModal(err.message)
    } finally {
      button.disabled = false
      button.textContent = label
    }
  }

  // ---- Solicitar devolución de los créditos
  function openRefundModal() {
    Modal.open(
      'Devolución de créditos',
      `<div class="purchase-confirmed">
        <p>Vamos a pedir la devolución de tus compras de créditos de los últimos 10 días. ¿Querés continuar?</p>
        <p class="create-raffle-error" id="refund-error" style="margin-top: 16px;"></p>
        <div class="detail-actions">
          <button class="btn btn-secondary" id="refund-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="refund-confirm-btn">Solicitar devolución</button>
        </div>
      </div>`
    )
    const cancelBtn = document.getElementById('refund-cancel-btn')
    const confirmBtn = document.getElementById('refund-confirm-btn')
    const errorEl = document.getElementById('refund-error')
    cancelBtn.addEventListener('click', () => Modal.close())
    confirmBtn.addEventListener('click', async () => {
      cancelBtn.disabled = true
      confirmBtn.disabled = true
      errorEl.classList.remove('is-visible')
      try {
        await Api.requestCreditRefund()
        showInfoModal('Devolución solicitada', 'Recibimos tu solicitud de devolución de créditos.')
        // La devolución puede cambiar el saldo de créditos.
        if (window.refreshRafflesPanel) window.refreshRafflesPanel()
      } catch (err) {
        cancelBtn.disabled = false
        confirmBtn.disabled = false
        errorEl.textContent = err.message
        errorEl.classList.add('is-visible')
      }
    })
  }

  // ---- Contactar a soporte
  function openSupportModal() {
    const options = SUPPORT_REQUEST_TYPES.map(
      (t) => `<option value="${escapeHtml(t.value)}">${escapeHtml(t.label)}</option>`
    ).join('')

    Modal.open(
      'Contactar a soporte',
      `<div class="support-form">
        <label class="field">
          <span>Motivo</span>
          <select id="support-type">${options}</select>
        </label>
        <label class="field" style="margin-top: 16px;">
          <span>Descripción (entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres)</span>
          <textarea id="support-description" rows="5" maxlength="${DESCRIPTION_MAX}" placeholder="Contanos qué necesitás."></textarea>
        </label>
        <p class="create-raffle-error" id="support-error" style="margin-top: 16px;"></p>
        <div class="detail-actions">
          <button class="btn btn-secondary" id="support-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="support-send-btn">Enviar</button>
        </div>
      </div>`
    )
    const typeEl = document.getElementById('support-type')
    const descEl = document.getElementById('support-description')
    const errorEl = document.getElementById('support-error')
    const cancelBtn = document.getElementById('support-cancel-btn')
    const sendBtn = document.getElementById('support-send-btn')

    cancelBtn.addEventListener('click', () => Modal.close())
    sendBtn.addEventListener('click', async () => {
      const description = descEl.value.trim()
      errorEl.classList.remove('is-visible')
      if (description.length < DESCRIPTION_MIN) {
        errorEl.textContent = `La descripción tiene que tener al menos ${DESCRIPTION_MIN} caracteres.`
        errorEl.classList.add('is-visible')
        return
      }

      cancelBtn.disabled = true
      sendBtn.disabled = true
      try {
        const created = await Api.createRequest({ requestsType: typeEl.value, description })
        const code = created && created.codigo ? ` Tu código es ${created.codigo}.` : ''
        showInfoModal('Solicitud enviada', 'Recibimos tu solicitud.' + code)
      } catch (err) {
        cancelBtn.disabled = false
        sendBtn.disabled = false
        errorEl.textContent = err.message
        errorEl.classList.add('is-visible')
      }
    })
  }

  const handlers = {
    'export-data': exportData,
    'refund-credits': openRefundModal,
    'contact-support': openSupportModal,
  }

  document.querySelectorAll('[data-account-action]').forEach((button) => {
    const handler = handlers[button.dataset.accountAction]
    if (handler) button.addEventListener('click', () => handler(button))
  })
})
