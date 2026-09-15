// Publicar una rifa nueva: valida que haya crédito disponible, descuenta 1
// crédito al confirmar (igual que describe la especificación) y deja la rifa
// tanto en "Mis rifas" como con su página pública completa en rifa.html.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('create-raffle-form')
  if (!form) return

  const errorBox = document.getElementById('create-raffle-error')
  const noCreditsNote = document.getElementById('create-raffle-no-credits')
  const submitBtn = document.getElementById('create-raffle-submit')
  const creditsNoteEl = document.getElementById('create-raffle-credits-note')
  const prizesContainer = document.getElementById('prizes-container')
  const addPrizeBtn = document.getElementById('add-prize-btn')

  const MIN_PRIZES = 3
  const MAX_PRIZES = 9

  function emptyPrizes(count) {
    return Array.from({ length: count }, () => ({ title: '', description: '', image: null }))
  }

  // Estado de los premios en memoria (no en el DOM), para poder agregar/quitar
  // tarjetas sin perder lo que ya se cargó en las demás. Se muestran uno
  // debajo del otro (sin carrusel ni scroll horizontal).
  let prizes = emptyPrizes(MIN_PRIZES)

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }

  function renderPrizes() {
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
            <input data-prize-field="title" data-index="${idx}" value="${escapeHtml(prize.title)}" />
          </label>
          <label class="field">
            <span>Descripción</span>
            <textarea data-prize-field="description" data-index="${idx}">${escapeHtml(prize.description)}</textarea>
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
  }

  addPrizeBtn.addEventListener('click', () => {
    if (prizes.length >= MAX_PRIZES) return
    prizes.push({ title: '', description: '', image: null })
    renderPrizes()
    // El premio nuevo queda al final de la lista; lo mostramos en pantalla
    // apenas se termina de pintar.
    requestAnimationFrame(() => {
      const cards = prizesContainer.querySelectorAll('.prize-form-card')
      const lastCard = cards[cards.length - 1]
      if (lastCard) lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })

  renderPrizes()

  function slugify(text) {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function uniqueId(base) {
    let id = base || 'rifa'
    let suffix = 2
    while (myRafflesData.some((r) => r.id === id)) {
      id = base + '-' + suffix
      suffix += 1
    }
    return id
  }

  function refreshCreditsWarning() {
    const hasCredits = creatorProfile.credits > 0
    noCreditsNote.classList.toggle('is-visible', !hasCredits)
    submitBtn.disabled = !hasCredits
    creditsNoteEl.textContent = creatorProfile.credits
  }

  refreshCreditsWarning()
  window.refreshCreateRaffleCredits = refreshCreditsWarning

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    errorBox.classList.remove('is-visible')

    if (creatorProfile.credits <= 0) {
      refreshCreditsWarning()
      return
    }

    // Los campos de cada premio no llevan "required" (la lista puede ser
    // larga y quedar fuera de la vista); se valida acá a mano y, si falta
    // algo, se desliza directo hasta ese premio.
    const invalidIndex = prizes.findIndex((p) => !p.title.trim() || !p.description.trim())
    if (invalidIndex !== -1) {
      const invalidCard = prizesContainer.querySelectorAll('.prize-form-card')[invalidIndex]
      if (invalidCard) invalidCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      errorBox.textContent = `Completá el título y la descripción del premio N° ${invalidIndex + 1}.`
      errorBox.classList.add('is-visible')
      return
    }

    const title = document.getElementById('cr-title').value.trim()
    const description = document.getElementById('cr-description').value.trim()
    const totalNumbers = Number(document.getElementById('cr-quantity').value)
    const pricePerNumber = Number(document.getElementById('cr-price').value)
    const daysLeft = Number(document.getElementById('cr-duration').value)
    const holdMinutes = Number(document.getElementById('cr-hold-minutes').value)

    const finalPrizes = prizes.map((prize, idx) => ({
      place: 'Premio N° ' + (idx + 1),
      title: prize.title.trim(),
      description: prize.description.trim(),
      image: prize.image || null,
    }))

    const id = uniqueId(slugify(title))

    // Se descuenta 1 crédito en el instante en que se confirma la publicación.
    creatorProfile.credits -= 1

    myRafflesData.unshift({
      id,
      title,
      status: 'ACTIVA',
      totalNumbers,
      sold: 0,
      daysLeft,
    })

    createdRaffleDetails[id] = {
      creatorId: 'juanperez',
      raffleId: id,
      title,
      description,
      organizer: {
        name: creatorProfile.name,
        dni: creatorProfile.dni,
        whatsapp: creatorProfile.whatsapp.replace(/\D/g, ''),
      },
      daysLeft,
      holdMinutes,
      pricePerNumber,
      totalNumbers,
      numbers: Array.from({ length: totalNumbers }, (_, i) => ({ number: i + 1, status: 'disponible' })),
      prizes: finalPrizes,
      bankDetails: {
        cbu: creatorProfile.cbu,
        alias: creatorProfile.alias,
        bank: 'Transferencia bancaria',
        holder: creatorProfile.accountHolder,
      },
    }

    if (window.refreshRafflesPanel) window.refreshRafflesPanel()
    showCreatedSuccess(id, title)

    form.reset()
    prizes = emptyPrizes(MIN_PRIZES)
    renderPrizes()
    refreshCreditsWarning()
  })

  function showCreatedSuccess(id, title) {
    const link =
      window.location.origin +
      window.location.pathname.replace('me.html', '') +
      'rifa.html?creador=juanperez&rifa=' +
      id
    const html = `
      <div class="purchase-confirmed">
        <div class="purchase-confirmed__icon">${Icons.check}</div>
        <h4>¡"${title}" está publicada!</h4>
        <p>Compartí este link para que la gente empiece a elegir números.</p>
        <div class="raffle-created__link-box">${link}</div>
        <button class="btn btn-primary" id="created-go-to-raffles" style="margin-top: 20px;">Ver en Mis rifas</button>
      </div>
    `
    Modal.open('Rifa publicada', html)
    document.getElementById('created-go-to-raffles').addEventListener('click', () => {
      Modal.close()
      document.querySelector('.sidebar__tab[data-tab="rifas"]').click()
    })
  }
})
