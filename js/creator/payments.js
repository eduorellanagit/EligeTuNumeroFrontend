// Validador de pagos: 3 bandejas (pendientes / aceptados / rechazados). Cada fila es
// una reserva (puede traer varios números) y sale de GET /reservas?estado=...
// Aceptar o rechazar llama al backend y después vuelve a pedir las 3 bandejas.
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('validator-list')
  if (!listEl) return

  const tabButtons = document.querySelectorAll('#validator-tabs .validator-tab')
  let activeTab = 'pendientes'

  // Cada bandeja del panel corresponde a un estado del backend.
  const statusByTab = {
    pendientes: 'PENDIENTE',
    aceptados: 'ACEPTADA',
    rechazados: 'RECHAZADA',
  }

  const paymentRequests = { pendientes: [], aceptados: [], rechazados: [] }
  let isLoading = true
  let loadError = ''

  const toneByTab = {
    pendientes: 'badge-warning',
    aceptados: 'badge-success',
    rechazados: 'badge-danger',
  }

  const labelByTab = {
    pendientes: 'Pendiente',
    aceptados: 'Aceptado',
    rechazados: 'Rechazado',
  }

  // ReservaResponseDto -> el formato que usa esta pantalla
  function toRequest(reserva) {
    return {
      id: reserva.id,
      raffleTitle: reserva.rifaTitulo,
      numbers: (reserva.numeros || []).slice().sort((a, b) => a - b),
      buyer: [reserva.compradorNombre, reserva.compradorApellido].filter(Boolean).join(' '),
      dni: reserva.compradorDni,
      address: reserva.compradorDireccion,
      whatsapp: reserva.compradorWhatsapp,
      amount: Number(reserva.monto) || 0,
      receiptUrl: reserva.comprobanteUrl,
    }
  }

  async function loadAll() {
    try {
      const tabs = Object.keys(statusByTab)
      const results = await Promise.all(tabs.map((tab) => Api.listReservations(statusByTab[tab])))
      tabs.forEach((tab, index) => {
        paymentRequests[tab] = results[index].map(toRequest)
      })
      loadError = ''
    } catch (err) {
      loadError = err.message
    }
    isLoading = false
    render()
  }

  function updateCounts() {
    Object.keys(paymentRequests).forEach((key) => {
      const countEl = document.getElementById('count-' + key)
      if (countEl) countEl.textContent = paymentRequests[key].length
    })
  }

  function numbersLabel(req) {
    return 'N° ' + req.numbers.join(', ')
  }

  function render() {
    updateCounts()

    tabButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === activeTab)
    })

    listEl.innerHTML = ''

    if (isLoading) {
      listEl.innerHTML = '<p class="validator-empty">Cargando solicitudes...</p>'
      return
    }

    if (loadError) {
      listEl.innerHTML = `<p class="validator-empty">${escapeHtml(loadError)}</p>`
      return
    }

    const list = paymentRequests[activeTab]

    if (list.length === 0) {
      listEl.innerHTML = '<p class="validator-empty">No hay solicitudes en esta bandeja.</p>'
      return
    }

    list.forEach((req) => {
      const row = document.createElement('div')
      row.className = 'validator-row'

      row.innerHTML = `
        <button class="validator-row__main" data-open-detail="${escapeHtml(req.id)}">
          <span class="validator-row__number">${escapeHtml(numbersLabel(req))}</span>
          <span class="badge ${toneByTab[activeTab]}">${labelByTab[activeTab]}</span>
          <span class="validator-row__buyer">${escapeHtml(req.buyer)}</span>
          <span class="validator-row__amount">$${req.amount.toLocaleString('es-AR')}</span>
        </button>
      `
      listEl.appendChild(row)
    })

    listEl.querySelectorAll('[data-open-detail]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn.dataset.openDetail))
    })
  }

  // Aceptar o rechazar. Si sale bien, se cierra el modal y se actualizan bandejas y rifas
  // (aceptar cambia cuántos números figuran como vendidos).
  async function decide(req, action, buttons, errorEl) {
    buttons.forEach((b) => b && (b.disabled = true))
    errorEl.classList.remove('is-visible')
    try {
      if (action === 'accept') await Api.acceptReservation(req.id)
      else await Api.rejectReservation(req.id)

      Modal.close()
      await loadAll()
      if (window.refreshRafflesPanel) window.refreshRafflesPanel()
    } catch (err) {
      buttons.forEach((b) => b && (b.disabled = false))
      errorEl.textContent = err.message
      errorEl.classList.add('is-visible')
    }
  }

  // Comprobante: una imagen se muestra, un PDF (o cualquier otro archivo) se abre en otra pestaña.
  function receiptHTML(url) {
    const safe = safeUrl(url)
    if (!safe) return 'Sin comprobante'
    const escaped = escapeHtml(safe)
    if (/\.pdf(\?|#|$)/i.test(safe)) {
      return `<a href="${escaped}" target="_blank" rel="noopener">Abrir comprobante (PDF) ↗</a>`
    }
    return `<a href="${escaped}" target="_blank" rel="noopener"><img src="${escaped}" alt="Comprobante de transferencia" /></a>`
  }

  function openDetail(id) {
    const req = paymentRequests[activeTab].find((r) => r.id === id)
    if (!req) return

    const whatsappDigits = onlyDigits(req.whatsapp)
    const whatsappHTML = whatsappDigits
      ? `<a class="detail-whatsapp" href="https://wa.me/${whatsappDigits}">${escapeHtml(req.whatsapp)}</a>`
      : escapeHtml(req.whatsapp)

    const actionsHTML =
      activeTab === 'pendientes'
        ? `
        <p class="create-raffle-error" id="detail-error" style="margin-top: 16px;"></p>
        <div class="detail-actions">
          <button class="btn btn-secondary" id="detail-reject-btn">Rechazar pago</button>
          <button class="btn btn-primary" id="detail-accept-btn">Aceptar pago</button>
        </div>
      `
        : ''

    const html = `
      <div class="detail-raffle">
        <span class="detail-label">Rifa</span>
        <p>${escapeHtml(req.raffleTitle)}</p>
      </div>

      <div class="detail-grid">
        <div>
          <span class="detail-label">Comprador</span>
          <p>${escapeHtml(req.buyer)}</p>
        </div>
        <div>
          <span class="detail-label">DNI / CUIL</span>
          <p>${escapeHtml(req.dni)}</p>
        </div>
        <div>
          <span class="detail-label">Dirección</span>
          <p>${escapeHtml(req.address)}</p>
        </div>
        <div>
          <span class="detail-label">WhatsApp</span>
          ${whatsappHTML}
        </div>
        <div>
          <span class="detail-label">Monto a verificar</span>
          <p>$${req.amount.toLocaleString('es-AR')}</p>
        </div>
      </div>

      <div class="detail-receipt">
        <span class="detail-label">Comprobante</span>
        <div class="detail-receipt-box">${receiptHTML(req.receiptUrl)}</div>
      </div>

      ${actionsHTML}
    `

    Modal.open(`Reserva · ${numbersLabel(req)}`, html)

    const acceptBtn = document.getElementById('detail-accept-btn')
    const rejectBtn = document.getElementById('detail-reject-btn')
    const errorEl = document.getElementById('detail-error')
    if (acceptBtn) acceptBtn.addEventListener('click', () => decide(req, 'accept', [acceptBtn, rejectBtn], errorEl))
    if (rejectBtn) rejectBtn.addEventListener('click', () => decide(req, 'reject', [acceptBtn, rejectBtn], errorEl))
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab
      render()
    })
  })

  // Cada vez que se entra a "Validar pagos" se vuelven a pedir, para ver las reservas nuevas.
  const paymentsTab = document.querySelector('.sidebar__tab[data-tab="pagos"]')
  if (paymentsTab) paymentsTab.addEventListener('click', loadAll)

  window.refreshPaymentsPanel = loadAll

  render()
  loadAll()
})
