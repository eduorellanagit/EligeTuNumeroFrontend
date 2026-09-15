// Validador de pagos: 3 bandejas (pendientes / aceptados / rechazados).
// Todo el estado vive en el objeto global `paymentRequests` (mock-data.js);
// esto solo se encarga de pintarlo y de mover ítems entre bandejas.
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('validator-list')
  if (!listEl) return

  const tabButtons = document.querySelectorAll('#validator-tabs .validator-tab')
  let activeTab = 'pendientes'

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

  function updateCounts() {
    Object.keys(paymentRequests).forEach((key) => {
      const countEl = document.getElementById('count-' + key)
      if (countEl) countEl.textContent = paymentRequests[key].length
    })
  }

  function render() {
    updateCounts()

    tabButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === activeTab)
    })

    const list = paymentRequests[activeTab]
    listEl.innerHTML = ''

    if (list.length === 0) {
      listEl.innerHTML = '<p class="validator-empty">No hay solicitudes en esta bandeja.</p>'
      return
    }

    list.forEach((req) => {
      const row = document.createElement('div')
      row.className = 'validator-row'

      row.innerHTML = `
        <button class="validator-row__main" data-open-detail="${req.id}">
          <span class="validator-row__number">N° ${req.number}</span>
          <span class="badge ${toneByTab[activeTab]}">${labelByTab[activeTab]}</span>
          <span class="validator-row__buyer">${req.buyer}</span>
          <span class="validator-row__amount">$${req.amount.toLocaleString('es-AR')}</span>
        </button>
      `
      listEl.appendChild(row)
    })

    listEl.querySelectorAll('[data-open-detail]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn.dataset.openDetail))
    })
  }

  function moveRequest(id, from, to, extra) {
    const index = paymentRequests[from].findIndex((r) => r.id === id)
    if (index === -1) return
    const [item] = paymentRequests[from].splice(index, 1)
    paymentRequests[to].unshift(Object.assign({}, item, extra || {}))
    Modal.close()
    render()
  }

  function openDetail(id) {
    const req = paymentRequests[activeTab].find((r) => r.id === id)
    if (!req) return

    const whatsappLink = 'https://wa.me/' + req.whatsapp.replace(/\D/g, '')
    const actionsHTML =
      activeTab === 'pendientes'
        ? `
        <div class="detail-actions">
          <button class="btn btn-secondary" id="detail-reject-btn">Rechazar pago</button>
          <button class="btn btn-primary" id="detail-accept-btn">Aceptar pago</button>
        </div>
      `
        : ''

    const html = `
      <div class="detail-grid">
        <div>
          <span class="detail-label">Comprador</span>
          <p>${req.buyer}</p>
        </div>
        <div>
          <span class="detail-label">DNI / CUIL</span>
          <p>${req.dni}</p>
        </div>
        <div>
          <span class="detail-label">Dirección</span>
          <p>${req.address}</p>
        </div>
        <div>
          <span class="detail-label">WhatsApp</span>
          <a class="detail-whatsapp" href="${whatsappLink}">${req.whatsapp}</a>
        </div>
      </div>

      <div class="detail-receipt">
        <span class="detail-label">Comprobante</span>
        <div class="detail-receipt-box">${req.receiptNote}</div>
      </div>

      ${actionsHTML}
    `

    Modal.open(`Boleto N° ${req.number}`, html)

    const acceptBtn = document.getElementById('detail-accept-btn')
    const rejectBtn = document.getElementById('detail-reject-btn')
    if (acceptBtn) acceptBtn.addEventListener('click', () => moveRequest(req.id, 'pendientes', 'aceptados'))
    if (rejectBtn) rejectBtn.addEventListener('click', () => moveRequest(req.id, 'pendientes', 'rechazados'))
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab
      render()
    })
  })

  render()
})
