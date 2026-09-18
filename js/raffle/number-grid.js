// Lee ?creador=...&rifa=... de la URL, arma la rifa de ejemplo y pinta
// encabezado, premios y grilla. También maneja qué números están elegidos
// (variable global `selectedNumbers`, que usa purchase-modal.js).
let currentRaffle = null
let selectedNumbers = []
const MAX_SELECTABLE_NUMBERS = 5

document.addEventListener('DOMContentLoaded', () => {
  const headerEl = document.getElementById('raffle-header')
  const galleryEl = document.getElementById('prize-gallery')
  const priceEl = document.getElementById('price-per-number')
  const gridEl = document.getElementById('number-grid')
  if (!headerEl || !gridEl) return

  const params = new URLSearchParams(window.location.search)
  const creatorId = params.get('creador') || 'juanperez'
  const raffleId = params.get('rifa') || 'moto-110'
  currentRaffle = getPublicRaffle(creatorId, raffleId)

  renderHeader()
  renderPrizes()
  setupPrizeCarousel()
  renderPrice()
  renderGrid()
  updateFloatBar()

  function renderHeader() {
    const whatsappLink = 'https://wa.me/' + currentRaffle.organizer.whatsapp
    headerEl.innerHTML = `
      <div>
        <p class="raffle-header__eyebrow">Rifa activa</p>
        <h1>${currentRaffle.title}</h1>
        <div class="raffle-header__organizer">
          <span>Organiza <strong>${currentRaffle.organizer.name}</strong> · DNI ${currentRaffle.organizer.dni}</span>
          <a class="raffle-header__whatsapp" href="${whatsappLink}">
            Escribir por WhatsApp
          </a>
        </div>
      </div>
      <div class="raffle-header__countdown">
        <strong>${currentRaffle.daysLeft}</strong>
        <span>días restantes</span>
      </div>
    `
  }

  function renderPrizes() {
    galleryEl.innerHTML = currentRaffle.prizes
      .map(
        (prize, idx) => `
        <button class="prize-card" data-open-prize="${idx}" type="button">
          ${prize.image ? `<img class="prize-card__thumb" src="${prize.image}" alt="" />` : ''}
          <span class="prize-card__place">${prize.place}</span>
          <h3>${prize.title}</h3>
          <p>${prize.description}</p>
        </button>
      `
      )
      .join('')

    galleryEl.querySelectorAll('[data-open-prize]').forEach((card) => {
      card.addEventListener('click', () => openPrizeDetail(Number(card.dataset.openPrize)))
    })
  }

  function openPrizeDetail(idx) {
    const prize = currentRaffle.prizes[idx]
    const imageHTML = prize.image
      ? `<img class="prize-detail__image" src="${prize.image}" alt="${prize.title}" />`
      : ''
    const html = `
      <div class="prize-detail">
        ${imageHTML}
        <span class="prize-card__place">${prize.place}</span>
        <p>${prize.description}</p>
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

    updateButtons()
  }

  function renderPrice() {
    priceEl.textContent = '$' + currentRaffle.pricePerNumber.toLocaleString('es-AR') + ' por número'
  }

  function renderGrid() {
    gridEl.innerHTML = currentRaffle.numbers
      .map(({ number, status }) => {
        const isSelected = selectedNumbers.includes(number)
        const isAvailable = status === 'disponible'
        const limitReached = !isSelected && isAvailable && selectedNumbers.length >= MAX_SELECTABLE_NUMBERS
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
    const entry = currentRaffle.numbers.find((n) => n.number === number)
    if (!entry || entry.status !== 'disponible') return

    if (selectedNumbers.includes(number)) {
      selectedNumbers = selectedNumbers.filter((n) => n !== number)
    } else {
      if (selectedNumbers.length >= MAX_SELECTABLE_NUMBERS) return
      selectedNumbers = [...selectedNumbers, number]
    }
    renderGrid()
    updateFloatBar()
  }

  window.renderGrid = renderGrid
  window.updateFloatBar = updateFloatBar
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
