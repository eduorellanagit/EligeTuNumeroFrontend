// Publicar una rifa nueva. Primero se suben las imágenes de los premios (POST /rifas/imagen,
// una por una) y después se crea la rifa con POST /rifas, que descuenta 1 crédito en el
// servidor. La rifa queda en "Mis rifas" y con su página pública en rifa.html.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('create-raffle-form')
  if (!form) return

  const errorBox = document.getElementById('create-raffle-error')
  const noCreditsNote = document.getElementById('create-raffle-no-credits')
  const incompleteProfileNote = document.getElementById('create-raffle-incomplete-profile')
  const submitBtn = document.getElementById('create-raffle-submit')
  const creditsNoteEl = document.getElementById('create-raffle-credits-note')
  const prizesContainer = document.getElementById('prizes-container')
  const prizeNavContainer = document.getElementById('prize-nav-mobile')
  const addPrizeBtn = document.getElementById('add-prize-btn')

  const MIN_PRIZES = 3
  const MAX_PRIZES = 9

  function emptyPrizes(count) {
    return Array.from({ length: count }, () => ({ title: '', description: '', image: null }))
  }

  // Estado de los premios en memoria (no en el DOM), para poder agregar/quitar
  // tarjetas sin perder lo que ya se cargó en las demás.
  let prizes = emptyPrizes(MIN_PRIZES)

  // Carrusel de premios: se ven 3 a la vez en desktop, 2 en tablet y 1 en
  // celular (ver css/create-raffle.css), pero siempre se avanza de a uno,
  // igual que en la página pública de la rifa.
  function stepPrizeCarousel(direction) {
    const card = prizesContainer.querySelector('.prize-form-card')
    if (!card) return
    const gap = parseFloat(getComputedStyle(prizesContainer).gap) || 16
    const amount = card.getBoundingClientRect().width + gap
    prizesContainer.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  function updatePrizeCarouselButtons() {
    const firstBtn = document.getElementById('prize-first-btn')
    const prevBtn = document.getElementById('prize-prev-btn')
    const nextBtn = document.getElementById('prize-next-btn')
    const lastBtn = document.getElementById('prize-last-btn')
    if (!prevBtn || !nextBtn) return
    const maxScroll = prizesContainer.scrollWidth - prizesContainer.clientWidth
    const atStart = prizesContainer.scrollLeft <= 4
    const atEnd = maxScroll <= 4 || prizesContainer.scrollLeft >= maxScroll - 4
    prevBtn.disabled = atStart
    nextBtn.disabled = atEnd
    if (firstBtn) firstBtn.disabled = atStart
    if (lastBtn) lastBtn.disabled = atEnd
  }

  function renderPrizeNav() {
    if (!prizeNavContainer) return
    prizeNavContainer.innerHTML = `
      <button type="button" class="carousel-btn" id="prize-first-btn" aria-label="Primer premio">
        ${Icons.chevronsLeft}
      </button>
      <button type="button" class="carousel-btn" id="prize-prev-btn" aria-label="Premio anterior">
        ${Icons.arrowLeft}
      </button>
      <button type="button" class="carousel-btn" id="prize-next-btn" aria-label="Premio siguiente">
        ${Icons.arrowRight}
      </button>
      <button type="button" class="carousel-btn" id="prize-last-btn" aria-label="Último premio">
        ${Icons.chevronsRight}
      </button>
    `
    document.getElementById('prize-first-btn').addEventListener('click', () => {
      prizesContainer.scrollTo({ left: 0, behavior: 'smooth' })
    })
    document.getElementById('prize-last-btn').addEventListener('click', () => {
      prizesContainer.scrollTo({ left: prizesContainer.scrollWidth, behavior: 'smooth' })
    })
    document.getElementById('prize-prev-btn').addEventListener('click', () => stepPrizeCarousel(-1))
    document.getElementById('prize-next-btn').addEventListener('click', () => stepPrizeCarousel(1))
    updatePrizeCarouselButtons()
  }

  function renderPrizes() {
    renderPrizeNav()

    prizesContainer.innerHTML = prizes
      .map(
        (prize, idx) => `
        <div class="prize-form-card">
          <div class="prize-form-card__header">
            <span class="prize-form-card__place">Premio N° ${idx + 1}</span>
            ${
              prizes.length > MIN_PRIZES
                ? `<button type="button" class="prize-remove-btn" data-remove-prize="${idx}" aria-label="Quitar premio">
                    ${Icons.minus}
                  </button>`
                : ''
            }
          </div>
          <label class="field">
            <span>Título del premio</span>
            <input data-prize-field="title" data-index="${idx}" maxlength="40" placeholder="" value="${escapeHtml(prize.title)}" />
          </label>
          <label class="field">
            <span>Descripción</span>
            <textarea data-prize-field="description" data-index="${idx}" maxlength="150" placeholder="">${escapeHtml(prize.description)}</textarea>
          </label>
          <div class="field">
            <span class="field-label-with-help">
              Imagen del premio
              <span class="help-badge">Auto</span>
            </span>
            <label class="upload-btn">
              <input type="file" accept="image/*" data-prize-image="${idx}" class="upload-btn__input" />
              ${Icons.upload} ${prize.image ? 'Cambiar imagen' : 'Subir imagen'}
            </label>
          </div>
          ${
            prize.image
              ? `<div class="prize-form-card__preview">
                  <img src="${prize.image}" alt="Vista previa del premio ${idx + 1}" />
                  <button type="button" class="prize-remove-image-btn" data-remove-image="${idx}">Quitar imagen</button>
                </div>`
              : ''
          }
        </div>
      `
      )
      .join('')

    prizesContainer.querySelectorAll('[data-prize-field]').forEach((el) => {
      el.addEventListener('input', () => {
        prizes[Number(el.dataset.index)][el.dataset.prizeField] = el.value
      })
      attachCounter(el, el.dataset.prizeField === 'title' ? 10 : 30, el.dataset.prizeField === 'title' ? 40 : 150)
    })

    prizesContainer.querySelectorAll('[data-remove-prize]').forEach((btn) => {
      btn.addEventListener('click', () => {
        prizes.splice(Number(btn.dataset.removePrize), 1)
        renderPrizes()
      })
    })

    prizesContainer.querySelectorAll('[data-prize-image]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const idx = Number(input.dataset.prizeImage)
        const file = e.target.files && e.target.files[0]
        if (!file) return

        const MAX_SIZE_MB = 4
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          errorBox.textContent = `La imagen pesa demasiado (máximo ${MAX_SIZE_MB}MB). Probá con una más liviana.`
          errorBox.classList.add('is-visible')
          input.value = ''
          return
        }

        const reader = new FileReader()
        reader.onload = () => {
          cropImageToSquare(reader.result, (squareDataUrl) => {
            prizes[idx].image = squareDataUrl
            renderPrizes()
          })
        }
        reader.readAsDataURL(file)
      })
    })

    prizesContainer.querySelectorAll('[data-remove-image]').forEach((btn) => {
      btn.addEventListener('click', () => {
        prizes[Number(btn.dataset.removeImage)].image = null
        renderPrizes()
      })
    })

    addPrizeBtn.disabled = prizes.length >= MAX_PRIZES
    updatePrizeCarouselButtons()
  }

  addPrizeBtn.addEventListener('click', () => {
    if (prizes.length >= MAX_PRIZES) return
    prizes.push({ title: '', description: '', image: null })
    renderPrizes()
    // El nuevo premio queda al final del carrusel; lo mostramos apenas se
    // termina de pintar.
    requestAnimationFrame(() => {
      prizesContainer.scrollTo({ left: prizesContainer.scrollWidth, behavior: 'smooth' })
      updatePrizeCarouselButtons()
    })
  })

  const counterUpdaters = [
    attachCounter(document.getElementById('cr-title'), 15, 45),
    attachCounter(document.getElementById('cr-description'), 50, 200),
    attachCounter(document.getElementById('cr-rules'), 50, 1000),
  ]
  renderPrizes()
  prizesContainer.addEventListener('scroll', updatePrizeCarouselButtons)
  window.addEventListener('resize', updatePrizeCarouselButtons)

  // Hacen falta créditos y el perfil completo (los compradores ven tus datos de cobro).
  function refreshCreditsWarning() {
    const hasCredits = creatorProfile.credits > 0
    const profileReady = creatorProfile.profileComplete
    noCreditsNote.classList.toggle('is-visible', creatorProfile.loaded && !hasCredits)
    incompleteProfileNote.classList.toggle('is-visible', creatorProfile.loaded && !profileReady)
    submitBtn.disabled = !(creatorProfile.loaded && hasCredits && profileReady)
    creditsNoteEl.textContent = creatorProfile.credits
  }

  refreshCreditsWarning()
  window.refreshCreateRaffleCredits = refreshCreditsWarning
  loadCreatorProfile()
    .then(refreshCreditsWarning)
    .catch((err) => {
      errorBox.textContent = err.message
      errorBox.classList.add('is-visible')
    })

  function showError(message) {
    errorBox.textContent = message
    errorBox.classList.add('is-visible')
  }

  // Sube la imagen de un premio (está guardada como dataURL, ya recortada a cuadrado) y
  // devuelve la URL pública que guardó el servidor.
  async function uploadPrizeImage(dataUrl, index) {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'premio-' + (index + 1) + '.jpg', { type: blob.type || 'image/jpeg' })
    const uploaded = await Api.uploadPrizeImage(file)
    return uploaded.url
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorBox.classList.remove('is-visible')

    if (creatorProfile.credits <= 0 || !creatorProfile.profileComplete) {
      refreshCreditsWarning()
      return
    }

    // Los campos de cada premio no llevan "required" (la lista puede ser
    // larga y quedar fuera de la vista); se valida acá a mano y, si falta
    // algo, se desliza directo hasta ese premio.
    const prizeError = (p) =>
      Validate.length(p.title, 10, 40, 'El título del premio') || Validate.length(p.description, 30, 150, 'La descripción del premio')
    const invalidIndex = prizes.findIndex((p) => prizeError(p))
    if (invalidIndex !== -1) {
      const invalidCard = prizesContainer.querySelectorAll('.prize-form-card')[invalidIndex]
      if (invalidCard) invalidCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
      showError(`Premio N° ${invalidIndex + 1}: ${prizeError(prizes[invalidIndex])}`)
      return
    }

    const title = document.getElementById('cr-title').value.trim()
    const description = document.getElementById('cr-description').value.trim()
    const rules = document.getElementById('cr-rules').value.trim()
    const textError =
      Validate.length(title, 15, 45, 'El título de la rifa') ||
      Validate.length(description, 50, 200, 'La descripción') ||
      Validate.length(rules, 50, 1000, 'Las reglas y condiciones')
    if (textError) {
      showError(textError)
      return
    }
    const totalNumbers = Number(document.getElementById('cr-quantity').value)
    const pricePerNumber = Number(document.getElementById('cr-price').value)
    const daysLeft = Number(document.getElementById('cr-duration').value)
    const maxPerPurchase = Number(document.getElementById('cr-max-per-purchase').value)

    // Pantalla de carga mientras se suben las imágenes y se publica la rifa.
    const publishingEl = document.createElement('div')
    publishingEl.className = 'page-loader page-loader--action'
    publishingEl.setAttribute('role', 'status')
    publishingEl.innerHTML =
      '<div class="page-loader__spinner" aria-hidden="true"></div><p class="page-loader__text">Publicando tu rifa...</p>'
    document.body.appendChild(publishingEl)

    // Mientras se publica el botón queda bloqueado: un doble clic descontaría 2 créditos.
    const submitLabel = submitBtn.textContent
    submitBtn.disabled = true
    submitBtn.textContent = 'Publicando...'

    try {
      const finalPrizes = []
      for (let idx = 0; idx < prizes.length; idx++) {
        const prize = prizes[idx]
        finalPrizes.push({
          titulo: prize.title.trim(),
          descripcion: prize.description.trim(),
          imagenUrl: prize.image ? await uploadPrizeImage(prize.image, idx) : null,
        })
      }

      // El servidor responde con "slugDelCreador/slugDeLaRifa"
      const created = String(
        await Api.createRaffle({
          titulo: title,
          descripcion: description,
          reglas: rules,
          premios: finalPrizes,
          totalNumeros: totalNumbers,
          precioPorNumero: pricePerNumber,
          maximoPorCompra: maxPerPurchase,
          diasVigencia: daysLeft,
        })
      ).replace(/"/g, '')
      const [ownerSlug, raffleId] = created.includes('/') ? created.split('/') : [creatorProfile.slug, created]

      publishingEl.remove()

      // El crédito ya se descontó en el servidor: se actualiza el saldo y la lista de rifas.
      await loadCreatorProfile(true).catch(() => {})
      if (window.refreshRafflesPanel) window.refreshRafflesPanel()
      showCreatedSuccess(ownerSlug, raffleId, title)

      form.reset()
      counterUpdaters.forEach((u) => u())
      prizes = emptyPrizes(MIN_PRIZES)
      renderPrizes()
      prizesContainer.scrollLeft = 0
    } catch (err) {
      // Los fallos de la API los explica la ventana de error (js/api.js); acá solo los demás.
      if (!(err instanceof ApiError)) showError(err.message)
    } finally {
      publishingEl.remove()
      submitBtn.textContent = submitLabel
      refreshCreditsWarning()
    }
  })

  function showCreatedSuccess(ownerSlug, raffleId, title) {
    // Link público: /rf/{slug del creador}/{id de la rifa} (Cloudflare lo sirve con rifa.html).
    const link = window.location.origin + '/rf/' + encodeURIComponent(ownerSlug) + '/' + encodeURIComponent(raffleId)
    const html = `
      <div class="modal-message">
        <p>"${escapeHtml(title)}" ya está publicada. Compartí este link para que la gente empiece a elegir números.</p>
        <div class="raffle-created__link-box">${escapeHtml(link)}</div>
        <div class="detail-actions detail-actions--equal">
          <button class="btn btn-secondary" id="created-copy-link" type="button">Copiar link</button>
          <button class="btn btn-primary" id="created-go-to-raffles" type="button">Ver mis rifas</button>
        </div>
      </div>
    `
    Modal.open('Rifa publicada', html)

    const copyBtn = document.getElementById('created-copy-link')
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(link)
      } catch (e) {
        // Sin permiso de portapapeles: se selecciona el texto para copiarlo a mano.
        const box = document.querySelector('.raffle-created__link-box')
        const range = document.createRange()
        range.selectNodeContents(box)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        document.execCommand && document.execCommand('copy')
      }
      copyBtn.textContent = '¡Copiado!'
      setTimeout(() => { copyBtn.textContent = 'Copiar link' }, 2000)
    })
    document.getElementById('created-go-to-raffles').addEventListener('click', () => {
      Modal.close()
      document.querySelector('.sidebar__tab[data-tab="rifas"]').click()
    })
  }
})
