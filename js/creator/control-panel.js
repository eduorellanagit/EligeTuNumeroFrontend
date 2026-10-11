// Panel de control: solicitudes de los usuarios, visible solo para la cuenta de soporte.
// Tres bandejas (recibidas / revisadas / todas), cada una con su propio endpoint. En el
// detalle de una solicitud, "Revisado" la marca en el backend (PUT /requests/update/{id})
// y vuelve a pedir las bandejas.
//
// Ojo: ocultar la sección es solo visual. Que solo soporte pueda ver y cambiar solicitudes
// lo tiene que garantizar el backend en cada endpoint.
document.addEventListener('DOMContentLoaded', () => {
  const SUPPORT_EMAIL = 'eligetunumero.soporte@gmail.com'

  // Valores del enum RequestsStatus del backend.
  const STATUS_RECEIVED = 'RECIBIDA'
  const STATUS_REVIEWED = 'RESUELTA'

  // Cómo se muestran los valores de los enums RequestsStatus y RequestsType.
  const STATUS_LABELS = { RECIBIDA: 'Recibida', RESUELTA: 'Revisada' }
  const TYPE_LABELS = { DEVOLUCION: 'Devolución', SOPORTE: 'Soporte', ERROR: 'Error', OTRO: 'Otro' }

  const tabEl = document.getElementById('control-tab')
  const listEl = document.getElementById('requests-list')
  if (!tabEl || !listEl) return

  const tabButtons = document.querySelectorAll('#requests-tabs .validator-tab')
  let activeTab = 'recibidos'

  const requests = { recibidos: [], revisados: [], todos: [] }
  let isLoading = true
  let loadError = ''

  // Si llega un valor que no está en la tabla, se muestra legible: "NUEVO_TIPO" -> "Nuevo tipo"
  function label(labels, value) {
    const key = String(value || '').toUpperCase()
    if (labels[key]) return labels[key]
    const clean = key.replace(/_/g, ' ').trim().toLowerCase()
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '—'
  }

  function formatDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  }

  // RequestsDto -> el formato que usa esta pantalla
  function toRequest(raw) {
    return {
      id: raw.id,
      code: raw.codigo || '',
      userId: raw.userId,
      email: raw.email || '',
      type: label(TYPE_LABELS, raw.requestsType),
      statusRaw: String(raw.requestsStatus || '').toUpperCase(),
      status: label(STATUS_LABELS, raw.requestsStatus),
      description: raw.description || '',
      createdAt: formatDate(raw.creadoEn),
      updatedAt: formatDate(raw.actualizadoEn),
    }
  }

  function isReviewed(req) {
    return req.statusRaw === STATUS_REVIEWED
  }

  async function loadAll() {
    try {
      const [received, reviewed, all] = await Promise.all([
        Api.listRequestsByStatus(STATUS_RECEIVED),
        Api.listRequestsByStatus(STATUS_REVIEWED),
        Api.listAllRequests(),
      ])
      requests.recibidos = received.map(toRequest)
      requests.revisados = reviewed.map(toRequest)
      requests.todos = all.map(toRequest)
      loadError = ''
    } catch (err) {
      loadError = err.message
    }
    isLoading = false
    render()
  }

  function render() {
    Object.keys(requests).forEach((key) => {
      const countEl = document.getElementById('count-' + key)
      if (countEl) countEl.textContent = requests[key].length
    })

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

    const list = requests[activeTab]
    if (list.length === 0) {
      listEl.innerHTML = '<p class="validator-empty">No hay solicitudes en esta bandeja.</p>'
      return
    }

    list.forEach((req) => {
      const row = document.createElement('div')
      row.className = 'validator-row'
      row.innerHTML = `
        <button class="validator-row__main" data-open-request="${escapeHtml(req.id)}">
          <span class="validator-row__number">${escapeHtml(req.code || '#' + req.id)}</span>
          <span class="badge ${isReviewed(req) ? 'badge-success' : 'badge-warning'}">${escapeHtml(req.status)}</span>
          <span class="validator-row__buyer">${escapeHtml(req.type)}</span>
          <span class="validator-row__amount">${escapeHtml(req.createdAt)}</span>
        </button>
      `
      listEl.appendChild(row)
    })

    listEl.querySelectorAll('[data-open-request]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn.dataset.openRequest))
    })
  }

  async function markReviewed(req, buttons, errorEl) {
    buttons.forEach((b) => b && (b.disabled = true))
    errorEl.classList.remove('is-visible')
    try {
      await Api.markRequestReviewed(req.id)
      Modal.close()
      await loadAll()
    } catch (err) {
      buttons.forEach((b) => b && (b.disabled = false))
      errorEl.textContent = err.message
      errorEl.classList.add('is-visible')
    }
  }

  function detailItem(label, value) {
    return `
        <div>
          <span class="detail-label">${label}</span>
          <p>${escapeHtml(value) || '—'}</p>
        </div>`
  }

  function openDetail(id) {
    const req = requests[activeTab].find((r) => String(r.id) === String(id))
    if (!req) return

    const reviewBtnHTML = isReviewed(req) ? '' : '<button class="btn btn-primary" id="request-review-btn">Revisado</button>'

    const html = `
      <div class="detail-grid">
        ${detailItem('Código', req.code)}
        ${detailItem('Id', req.id)}
        ${detailItem('Id del usuario', req.userId)}
        ${detailItem('Email', req.email)}
        ${detailItem('Tipo', req.type)}
        ${detailItem('Estado', req.status)}
        ${detailItem('Fecha de creación', req.createdAt)}
        ${detailItem('Última actualización', req.updatedAt)}
      </div>

      <div class="detail-receipt">
        <span class="detail-label">Descripción</span>
        <div class="detail-receipt-box report-description">${escapeHtml(req.description) || 'Sin descripción'}</div>
      </div>

      <p class="create-raffle-error" id="request-error" style="margin-top: 16px;"></p>
      <div class="detail-actions">
        <button class="btn btn-secondary" id="request-close-btn">Cerrar</button>
        ${reviewBtnHTML}
      </div>
    `

    Modal.open(`Solicitud ${req.code || '#' + req.id}`, html)

    const closeBtn = document.getElementById('request-close-btn')
    const reviewBtn = document.getElementById('request-review-btn')
    const errorEl = document.getElementById('request-error')
    closeBtn.addEventListener('click', () => Modal.close())
    if (reviewBtn) reviewBtn.addEventListener('click', () => markReviewed(req, [closeBtn, reviewBtn], errorEl))
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab
      render()
    })
  })

  // Las solicitudes se piden solo al entrar a "Panel de control".
  tabEl.addEventListener('click', loadAll)

  // El email sale de GET /usuarios/me, que el panel ya pide al cargar (no suma otra llamada).
  loadCreatorProfile()
    .then(() => {
      if (creatorProfile.email.trim().toLowerCase() === SUPPORT_EMAIL) tabEl.hidden = false
    })
    .catch(() => {})

  render()
})
