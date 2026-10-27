// Sección "Cuenta y privacidad". Cada botón del HTML trae un data-account-action:
//   export-data      → muestra los datos de la cuenta y permite descargarlos (GET /usuarios/me/data)
//   refund-credits   → pide la devolución de las compras recientes   (POST /requests/devolucion)
//   contact-support  → envía una solicitud a soporte                 (POST /requests/request)
//   deactivate-account → pide confirmación y desactiva la cuenta     (POST /usuarios/me/desactivar)
document.addEventListener('DOMContentLoaded', () => {
  // Valores del enum RequestsType del backend. DEVOLUCION no está: tiene su propio botón.
  const SUPPORT_REQUEST_TYPES = [
    { value: 'SOPORTE', label: 'Consulta o ayuda' },
    { value: 'ERROR', label: 'Reportar un error' },
    { value: 'OTRO', label: 'Otro' },
  ]
  const DESCRIPTION_MIN = 10
  const DESCRIPTION_MAX = 1000

  function showInfoModal(title, message) {
    Modal.open(
      title,
      `<div class="modal-message">
        <p>${escapeHtml(message)}</p>
        <button class="btn btn-primary btn-block" id="info-modal-ok">Entendido</button>
      </div>`
    )
    document.getElementById('info-modal-ok').addEventListener('click', () => Modal.close())
  }

  // ---- Pedir mis datos: se muestran en un modal y desde ahí se descargan como .json
  const ENUM_LABELS = {
    RECIBIDA: 'Recibida',
    RESUELTA: 'Revisada',
    DEVOLUCION: 'Devolución',
    SOPORTE: 'Soporte',
    ERROR: 'Error',
    OTRO: 'Otro',
  }

  function dataValue(value) {
    return value === null || value === undefined || value === '' ? '—' : String(value)
  }

  function dataEnum(value) {
    if (!value) return '—'
    const key = String(value).toUpperCase()
    if (ENUM_LABELS[key]) return ENUM_LABELS[key]
    const clean = key.replace(/_/g, ' ').toLowerCase()
    return clean.charAt(0).toUpperCase() + clean.slice(1)
  }

  function dataDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  }

  function dataMoney(value) {
    const number = Number(value)
    return isNaN(number) ? '—' : '$' + number.toLocaleString('es-AR')
  }

  function dataRows(rows) {
    return `<div class="data-list">${rows
      .map(([label, value]) => `<div class="data-row"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`)
      .join('')}</div>`
  }

  // Cada elemento de una lista (rifa, compra, solicitud) es un bloque con sus propios datos.
  function dataGroup(title, items, toRows, emptyText) {
    const body = items && items.length
      ? items.map((item) => `<div class="data-card">${dataRows(toRows(item))}</div>`).join('')
      : `<p class="data-empty">${emptyText}</p>`
    return `<h4 class="data-title">${title}</h4>${body}`
  }

  function downloadJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mis-datos-eligetunumero.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function openDataModal(data) {
    const html = `
      <div class="data-modal">
        <h4 class="data-title">Datos personales</h4>
        ${dataRows([
          ['Nombre', dataValue(data.nombre)],
          ['DNI', dataValue(data.dni)],
          ['WhatsApp', dataValue(data.whatsapp)],
          ['Email', dataValue(data.email)],
          ['Inicio de sesión con', dataEnum(data.provider)],
          ['Cuenta creada', dataDate(data.creadoEn)],
          ['Créditos disponibles', dataValue(data.creditosDisponibles)],
        ])}

        <h4 class="data-title">Datos bancarios</h4>
        ${dataRows([
          ['Banco', dataValue(data.nombreBanco)],
          ['Titular', dataValue(data.titularCuenta)],
          ['CBU', dataValue(data.cbu)],
          ['Alias', dataValue(data.alias)],
        ])}

        ${dataGroup(
          'Mis rifas',
          data.listRaffle,
          (r) => [
            ['Título', dataValue(r.titulo)],
            ['Estado', dataEnum(r.raffleStatus)],
            ['Creada', dataDate(r.creadoEn)],
            ['Precio por número', dataMoney(r.precioNumero)],
            ['Total de números', dataValue(r.totalNumeros)],
            ['Reservas recibidas', dataValue(r.reservasRecibidas)],
          ],
          'Todavía no creaste rifas.'
        )}

        ${dataGroup(
          'Compras de créditos',
          data.listCompraCredito,
          (c) => [
            ['Plan', dataEnum(c.creditPlan)],
            ['Monto', dataMoney(c.monto)],
            ['Estado', dataEnum(c.planStatus)],
            ['Fecha de compra', dataDate(c.creadoEn)],
            ['Confirmada', dataDate(c.confirmadoEn)],
          ],
          'Todavía no compraste créditos.'
        )}

        ${dataGroup(
          'Solicitudes',
          data.listSolicitud,
          (q) => [
            ['Código', dataValue(q.codigo)],
            ['Tipo', dataEnum(q.tipo)],
            ['Estado', dataEnum(q.estado)],
            ['Descripción', dataValue(q.descripcion)],
            ['Creada', dataDate(q.creadoEn)],
            ['Última actualización', dataDate(q.actualizadoEn)],
          ],
          'Todavía no enviaste solicitudes.'
        )}

        <button class="btn btn-primary btn-block" id="data-download-btn" style="margin-top: 24px;">Descargar archivo</button>
      </div>
    `
    Modal.open('Tus datos', html)
    document.getElementById('data-download-btn').addEventListener('click', () => downloadJson(data))
  }

  async function exportData(button) {
    const label = button.textContent
    button.disabled = true
    button.textContent = 'Cargando...'
    try {
      openDataModal(await Api.getMyData())
    } catch (err) {
      // La ventana de error ya explica qué pasó (js/api.js).
    } finally {
      button.disabled = false
      button.textContent = label
    }
  }

  // ---- Solicitar devolución de los créditos
  // Arma el aviso con lo que devuelve el backend: código, créditos devueltos y monto del reintegro.
  function refundParagraphs(refund) {
    const intro = 'Recibimos tu solicitud de devolución de créditos.'
    if (!refund) return [intro]
    const lines = []
    if (refund.codigo) lines.push(`Código de consulta: ${refund.codigo}.`)
    if (refund.creditosDevueltos !== undefined && refund.creditosDevueltos !== null) {
      lines.push(`Créditos devueltos: ${refund.creditosDevueltos}.`)
    }
    const amount = Number(refund.montoReintegro)
    if (refund.montoReintegro !== undefined && refund.montoReintegro !== null && !isNaN(amount)) {
      lines.push(`Monto a reintegrar: $${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`)
    }
    return lines.length ? [[intro + ' Estos son los datos:', ...lines]] : [intro]
  }

  function openRefundModal() {
    Modal.open(
      'Devolución de créditos',
      `<div class="modal-message">
        <p>Vamos a pedir la devolución de tus compras de créditos de los últimos 10 días. ¿Querés continuar?</p>
        <div class="detail-actions detail-actions--equal">
          <button class="btn btn-secondary" id="refund-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="refund-confirm-btn">Continuar</button>
        </div>
      </div>`
    )
    const cancelBtn = document.getElementById('refund-cancel-btn')
    const confirmBtn = document.getElementById('refund-confirm-btn')
    cancelBtn.addEventListener('click', () => Modal.close())
    confirmBtn.addEventListener('click', async () => {
      cancelBtn.disabled = true
      confirmBtn.disabled = true
      try {
        const refund = await Api.requestCreditRefund()
        Modal.notice('Devolución solicitada', refundParagraphs(refund))
        // La devolución puede cambiar el saldo de créditos.
        if (window.refreshRafflesPanel) window.refreshRafflesPanel()
      } catch (err) {
        // La ventana de error ya explica qué pasó (js/api.js).
        cancelBtn.disabled = false
        confirmBtn.disabled = false
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
          <select id="support-type" data-custom-select>${options}</select>
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
    enhanceCustomSelects(document.querySelector('.support-form'))
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
        const code = created && created.codigo ? ` Su código es ${created.codigo}.` : ''
        showInfoModal('Solicitud enviada', 'La solicitud fue enviada con éxito.' + code)
      } catch (err) {
        // La ventana de error ya explica qué pasó (js/api.js).
        cancelBtn.disabled = false
        sendBtn.disabled = false
      }
    })
  }

  // ---- Desactivar cuenta
  function openDeactivateModal() {
    Modal.open(
      'Desactivar cuenta',
      `<div class="modal-message">
        <p>¿Estás seguro de que deseas continuar con la desactivación de su cuenta?</p>
        <p class="deactivate-note">
          Al desactivarla, se van a cerrar automáticamente todas tus rifas abiertas. Además, tenés que
          atender cada solicitud pendiente (en "Validar pagos") antes de poder desactivar la cuenta.
        </p>
        <div class="detail-actions detail-actions--equal">
          <button class="btn btn-secondary" id="deactivate-cancel-btn">Cancelar</button>
          <button class="btn btn-danger" id="deactivate-confirm-btn">Continuar</button>
        </div>
      </div>`
    )
    const cancelBtn = document.getElementById('deactivate-cancel-btn')
    const confirmBtn = document.getElementById('deactivate-confirm-btn')
    cancelBtn.addEventListener('click', () => Modal.close())
    confirmBtn.addEventListener('click', async () => {
      cancelBtn.disabled = true
      confirmBtn.disabled = true
      try {
        await Api.deactivateAccount()
      } catch (err) {
        // La ventana de error ya explica qué pasó (por ejemplo, solicitudes sin atender).
        cancelBtn.disabled = false
        confirmBtn.disabled = false
        return
      }

      // La cuenta ya está desactivada: se borra la sesión y, al cerrar el aviso, se vuelve al inicio.
      clearAuthToken()
      const goHome = () => window.location.replace('index.html')
      Modal.open(
        'Cuenta desactivada',
        `<div class="modal-message">
          <p>Tu cuenta fue desactivada.</p>
          <button class="btn btn-primary btn-block" id="deactivate-done-btn">Listo</button>
        </div>`,
        goHome
      )
      document.getElementById('deactivate-done-btn').addEventListener('click', () => Modal.close())
    })
  }

  const handlers = {
    'export-data': exportData,
    'refund-credits': openRefundModal,
    'contact-support': openSupportModal,
    'deactivate-account': openDeactivateModal,
  }

  document.querySelectorAll('[data-account-action]').forEach((button) => {
    const handler = handlers[button.dataset.accountAction]
    if (handler) button.addEventListener('click', () => handler(button))
  })
})
