// Lee ?creador=...&rifa=... de la URL, trae la rifa del backend (GET /rifas/{creador}/{rifa})
// y pinta encabezado, premios y grilla. También maneja qué números están elegidos
// (variable global `selectedNumbers`, que usa purchase-modal.js).
let currentRaffle = null
let selectedNumbers = []
const DEFAULT_MAX_SELECTABLE_NUMBERS = 5

// Máximo de números por compra que definió el organizador al crear la rifa.
function getMaxSelectableNumbers() {
  return (currentRaffle && currentRaffle.maxPerPurchase) || DEFAULT_MAX_SELECTABLE_NUMBERS
}

// Solo se pueden elegir números mientras la rifa está activa.
function isRaffleActive() {
  return Boolean(currentRaffle) && currentRaffle.status === 'ACTIVA'
}

// RifaPublicaDto del backend -> el formato que usa esta pantalla
function toPublicRaffleModel(dto) {
  const organizer = dto.organizador || {}
  const bank = dto.datosBancarios || {}

  return {
    id: dto.id,
    title: dto.titulo,
    description: dto.descripcion,
    status: dto.estado,
    organizer: {
      name: organizer.nombre,
      dni: organizer.dni,
      whatsapp: onlyDigits(organizer.whatsapp),
    },
    daysLeft: dto.diasRestantes,
    maxPerPurchase: dto.maximoPorCompra,
    pricePerNumber: Number(dto.precioPorNumero),
    totalNumbers: dto.totalNumeros,
    numbers: (dto.numeros || [])
      .map((n) => ({ number: n.numero, status: String(n.estado).toLowerCase() }))
      .sort((a, b) => a.number - b.number),
    prizes: (dto.premios || []).map((p, idx) => ({
      place: 'Premio N° ' + (idx + 1),
      title: p.titulo,
      description: p.descripcion,
      image: safeUrl(p.imagenUrl) || null,
    })),
    bankDetails: {
      bank: bank.bancoNombre,
      holder: bank.nombreTitular,
      cbu: bank.cbu,
      alias: bank.alias,
    },
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const headerEl = document.getElementById('raffle-header')
  const galleryEl = document.getElementById('prize-gallery')
  const priceEl = document.getElementById('price-per-number')
  const gridEl = document.getElementById('number-grid')
  if (!headerEl || !gridEl) return

  const params = new URLSearchParams(window.location.search)
  const creatorSlug = params.get('creador')
  const raffleSlug = params.get('rifa')

  // Mensaje a pantalla completa cuando no hay rifa para mostrar (link roto, rifa inexistente, error de red).
  function showRaffleMessage(title, text) {
    headerEl.innerHTML = `
      <div>
        <p class="raffle-header__eyebrow">Rifa</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="raffle-header__description">${escapeHtml(text)}</p>
      </div>
    `
    document.querySelectorAll('main .raffle-section').forEach((section) => {
      section.style.display = 'none'
    })
  }

  if (!creatorSlug || !raffleSlug) {
    showRaffleMessage('Este link no es válido', 'Pedile al organizador que te pase el link completo de la rifa.')
    return
  }

  headerEl.innerHTML = '<p class="raffle-header__description">Cargando rifa...</p>'

  // Trae la rifa del servidor. Se vuelve a llamar después de reservar (o si un número ya no está
  // libre) para que la grilla muestre el estado real.
  async function loadRaffle() {
    const dto = await Api.getPublicRaffle(creatorSlug, raffleSlug)
    currentRaffle = toPublicRaffleModel(dto)
    document.title = currentRaffle.title + ' — EligeTuNumero'

    // Si alguien más reservó un número que yo había elegido, se saca de mi selección.
    selectedNumbers = selectedNumbers.filter((n) =>
      currentRaffle.numbers.some((entry) => entry.number === n && entry.status === 'disponible')
    )
  }

  function renderAll() {
    renderHeader()
    renderPrizes()
    renderPrice()
    renderGrid()
    updateFloatBar()
  }

  function renderHeader() {
    const active = isRaffleActive()
    const eyebrows = { ACTIVA: 'Rifa activa', CERRADA: 'Rifa cerrada', EXPIRADA: 'Rifa finalizada' }
    const whatsappHTML = currentRaffle.organizer.whatsapp
      ? `<a class="raffle-header__whatsapp" href="https://wa.me/${currentRaffle.organizer.whatsapp}">
            Escribir por WhatsApp
          </a>`
      : ''
    const descriptionHTML = currentRaffle.description
      ? `<p class="raffle-header__description">${escapeHtml(currentRaffle.description)}</p>`
      : ''
    const countdownHTML = active
      ? `<strong>${currentRaffle.daysLeft}</strong><span>${currentRaffle.daysLeft === 1 ? 'día restante' : 'días restantes'}</span>`
      : `<strong>—</strong><span>ya no se reservan números</span>`

    headerEl.innerHTML = `
      <div>
        <p class="raffle-header__eyebrow">${eyebrows[currentRaffle.status] || 'Rifa'}</p>
        <h1>${escapeHtml(currentRaffle.title)}</h1>
        ${descriptionHTML}
        <div class="raffle-header__organizer">
          <span>Organiza <strong>${escapeHtml(currentRaffle.organizer.name)}</strong> · DNI ${escapeHtml(currentRaffle.organizer.dni)}</span>
          ${whatsappHTML}
        </div>
      </div>
      <div class="raffle-header__countdown">
        ${countdownHTML}
      </div>
    `
  }

  function renderPrizes() {
    galleryEl.innerHTML = currentRaffle.prizes
      .map(
        (prize, idx) => `
        <button class="prize-card" data-open-prize="${idx}" type="button">
          ${prize.image ? `<img class="prize-card__thumb" src="${escapeHtml(prize.image)}" alt="" />` : ''}
          <span class="prize-card__place">${escapeHtml(prize.place)}</span>
          <h3>${escapeHtml(prize.title)}</h3>
          <p>${escapeHtml(prize.description)}</p>
        </button>
      `
      )
      .join('')

    galleryEl.querySelectorAll('[data-open-prize]').forEach((card) => {
      card.addEventListener('click', () => openPrizeDetail(Number(card.dataset.openPrize)))
    })

    if (window.updatePrizeCarouselButtons) window.updatePrizeCarouselButtons()
  }

  function openPrizeDetail(idx) {
    const prize = currentRaffle.prizes[idx]
    const imageHTML = prize.image
      ? `<img class="prize-detail__image" src="${escapeHtml(prize.image)}" alt="${escapeHtml(prize.title)}" />`
      : ''
    const html = `
      <div class="prize-detail">
        ${imageHTML}
        <span class="prize-card__place">${escapeHtml(prize.place)}</span>
        <p>${escapeHtml(prize.description)}</p>
      </div>
    `
    Modal.open(prize.title, html)
  }

  function setupPrizeCarousel() {
    const track = galleryEl
    const firstBtn = document.getElementById('prize-carousel-first')
    const prevBtn = document.getElementById('prize-carousel-prev')
    const nextBtn = document.getElementById('prize-carousel-next')
    const lastBtn = document.getElementById('prize-carousel-last')
    if (!track || !prevBtn || !nextBtn) return

    function step(direction) {
      const card = track.querySelector('.prize-card')
      if (!card) return
      const gap = parseFloat(getComputedStyle(track).gap) || 16
      const amount = card.getBoundingClientRect().width + gap
      track.scrollBy({ left: direction * amount, behavior: 'smooth' })
    }

    function updateButtons() {
      const maxScroll = track.scrollWidth - track.clientWidth
      const atStart = track.scrollLeft <= 4
      const atEnd = maxScroll <= 4 || track.scrollLeft >= maxScroll - 4
      prevBtn.disabled = atStart
      nextBtn.disabled = atEnd
      if (firstBtn) firstBtn.disabled = atStart
      if (lastBtn) lastBtn.disabled = atEnd
    }

    if (firstBtn) firstBtn.addEventListener('click', () => track.scrollTo({ left: 0, behavior: 'smooth' }))
    if (lastBtn) lastBtn.addEventListener('click', () => track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }))
    prevBtn.addEventListener('click', () => step(-1))
    nextBtn.addEventListener('click', () => step(1))
    track.addEventListener('scroll', updateButtons)
    window.addEventListener('resize', updateButtons)

    window.updatePrizeCarouselButtons = updateButtons
    updateButtons()
  }

  function renderPrice() {
    priceEl.textContent = '$' + currentRaffle.pricePerNumber.toLocaleString('es-AR') + ' por número'
  }

  function renderGrid() {
    const active = isRaffleActive()
    gridEl.innerHTML = currentRaffle.numbers
      .map(({ number, status }) => {
        const isSelected = selectedNumbers.includes(number)
        const isAvailable = active && status === 'disponible'
        const limitReached = !isSelected && isAvailable && selectedNumbers.length >= getMaxSelectableNumbers()
        const cssClass = isSelected
          ? 'number-cell--selected'
          : limitReached
          ? 'number-cell--disponible number-cell--limit'
          : 'number-cell--' + status
        return `
          <button
            class="number-cell ${cssClass}"
            data-number="${number}"
            ${!isAvailable || limitReached ? 'disabled' : ''}
          >${number}</button>
        `
      })
      .join('')

    gridEl.querySelectorAll('.number-cell').forEach((cell) => {
      cell.addEventListener('click', () => toggleNumber(Number(cell.dataset.number)))
    })
  }

  window.toggleNumber = toggleNumber
  function toggleNumber(number) {
    if (!isRaffleActive()) return
    const entry = currentRaffle.numbers.find((n) => n.number === number)
    if (!entry || entry.status !== 'disponible') return

    if (selectedNumbers.includes(number)) {
      selectedNumbers = selectedNumbers.filter((n) => n !== number)
    } else {
      if (selectedNumbers.length >= getMaxSelectableNumbers()) return
      selectedNumbers = [...selectedNumbers, number]
    }
    renderGrid()
    updateFloatBar()
  }

  window.renderGrid = renderGrid
  window.updateFloatBar = updateFloatBar

  // Vuelve a pedir la rifa y repinta (la usa purchase-modal.js después de reservar).
  window.reloadRaffle = async function () {
    try {
      await loadRaffle()
      renderAll()
    } catch (err) {
      // se deja lo que ya estaba en pantalla
    }
  }

  setupPrizeCarousel()
  try {
    await loadRaffle()
  } catch (err) {
    showRaffleMessage(
      err.status === 404 ? 'No encontramos esta rifa' : 'No pudimos cargar la rifa',
      err.status === 404 ? 'Revisá que el link esté completo o pedile uno nuevo al organizador.' : err.message
    )
    return
  }
  renderAll()
})

function updateFloatBar() {
  const bar = document.getElementById('float-bar')
  const textEl = document.getElementById('float-bar-text')
  if (!bar || !currentRaffle) return

  if (selectedNumbers.length === 0) {
    bar.classList.remove('is-visible')
    return
  }

  const total = selectedNumbers.length * currentRaffle.pricePerNumber
  const plural = selectedNumbers.length > 1 ? 's' : ''
  textEl.innerHTML = `<strong>${selectedNumbers.length}</strong> número${plural} elegido${plural} · <strong>$${total.toLocaleString('es-AR')}</strong>`
  bar.classList.add('is-visible')
}
