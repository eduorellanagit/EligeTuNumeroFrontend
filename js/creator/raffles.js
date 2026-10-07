// Pinta el saldo de créditos y la lista de "mis rifas". Comprar créditos es un flujo de
// 3 pasos (elegir paquete -> confirmar -> pagar en Mercado Pago). Los créditos los
// acredita el backend cuando Mercado Pago le avisa que el pago se aprobó; por eso, al
// volver de pagar, esta pantalla consulta el saldo hasta que aparezcan.
document.addEventListener('DOMContentLoaded', async () => {
  const creditContainer = document.getElementById('credit-balance-container')
  const rafflesList = document.getElementById('raffles-list')
  if (!creditContainer || !rafflesList) return

  // Se guarda antes de ir a Mercado Pago para saber, al volver, cuántos créditos tenía.
  const PENDING_PURCHASE_KEY = 'eligetunumero_pending_purchase'

  let myRafflesData = []

  // -------- Saldo de créditos --------
  function renderCreditBalance() {
    const plansPreviewHTML = pricingPlans
      .map(
        (plan) => `
        <button class="credit-card__plan" data-plan="${plan.id}">
          <strong>$${plan.price}</strong>
          <span>${plan.raffles === 1 ? '1 rifa' : plan.raffles + ' rifas'}</span>
        </button>
      `
      )
      .join('')

    creditContainer.innerHTML = `
      <div class="credit-card">
        <div>
          <p class="credit-card__label">Créditos disponibles</p>
          <p class="credit-card__count">${creatorProfile.credits}</p>
        </div>
        <div class="credit-card__plans">${plansPreviewHTML}</div>
        <button class="btn btn-secondary" id="buy-credits-btn">${Icons.card} Comprar créditos</button>
      </div>
    `

    creditContainer.querySelectorAll('[data-plan]').forEach((btn) => {
      btn.addEventListener('click', () => openBuyCreditsModal(btn.dataset.plan))
    })
    document.getElementById('buy-credits-btn').addEventListener('click', () => openBuyCreditsModal(null))
  }

  // -------- Flujo de compra de créditos (modal, 3 pasos) --------
  function openBuyCreditsModal(preselectedPlanId) {
    showChoosePlanStep(preselectedPlanId)
  }

  function showChoosePlanStep(preselectedPlanId) {
    const optionsHTML = pricingPlans
      .map(
        (plan) => `
        <label class="credit-option ${plan.id === preselectedPlanId ? 'is-selected' : ''}">
          <input type="radio" name="credit-plan" value="${plan.id}" ${plan.id === preselectedPlanId ? 'checked' : ''} />
          <span class="credit-option__info">
            <strong>${plan.name} · ${plan.raffles === 1 ? '1 rifa' : plan.raffles + ' rifas'}</strong>
            <span>$${plan.price} USD · ${plan.tagline}</span>
          </span>
        </label>
      `
      )
      .join('')

    const html = `
      <div class="credit-purchase">
        <p class="credit-purchase__lead">Elegí cuántas rifas querés poder publicar. Los créditos no vencen.</p>
        <div class="credit-purchase__options" id="credit-purchase-options">${optionsHTML}</div>
        <button class="btn btn-primary btn-block" id="credit-purchase-continue" ${preselectedPlanId ? '' : 'disabled'}>
          Continuar
        </button>
      </div>
    `
    Modal.open('Comprar créditos', html)

    const optionsContainer = document.getElementById('credit-purchase-options')
    const continueBtn = document.getElementById('credit-purchase-continue')

    optionsContainer.querySelectorAll('input[name="credit-plan"]').forEach((input) => {
      input.addEventListener('change', () => {
        optionsContainer.querySelectorAll('.credit-option').forEach((label) => label.classList.remove('is-selected'))
        input.closest('.credit-option').classList.add('is-selected')
        continueBtn.disabled = false
      })
    })

    continueBtn.addEventListener('click', () => {
      const chosenId = optionsContainer.querySelector('input[name="credit-plan"]:checked').value
      const plan = pricingPlans.find((p) => p.id === chosenId)
      showConfirmStep(plan)
    })
  }

  function showConfirmStep(plan) {
    const html = `
      <div class="credit-purchase">
        <div class="credit-purchase__summary">
          <p>Vas a comprar</p>
          <h3>${plan.raffles === 1 ? '1 rifa' : plan.raffles + ' rifas'} · $${plan.price} USD</h3>
          <p class="credit-purchase__note">Se cobra en tu moneda local a través de Mercado Pago.</p>
        </div>
        <p class="credit-purchase__status" id="credit-purchase-status"></p>
        <div class="purchase-actions">
          <button class="btn btn-secondary" id="credit-purchase-back">Volver</button>
          <button class="btn btn-primary" id="credit-purchase-confirm">Confirmar compra</button>
        </div>
      </div>
    `
    Modal.open('Confirmar compra', html)

    document.getElementById('credit-purchase-back').addEventListener('click', () => showChoosePlanStep(plan.id))
    document.getElementById('credit-purchase-confirm').addEventListener('click', (e) => {
      confirmPurchase(plan, e.target)
    })
  }

  // Le pide al backend crear la compra y abre Mercado Pago en una pestaña nueva.
  // La pestaña se abre en el momento del click (antes de esperar al servidor); si se abriera
  // después, los navegadores (sobre todo en celular) la bloquean como ventana emergente.
  async function confirmPurchase(plan, confirmBtn) {
    const backBtn = document.getElementById('credit-purchase-back')
    const statusEl = document.getElementById('credit-purchase-status')
    confirmBtn.disabled = true
    backBtn.disabled = true
    statusEl.textContent = 'Preparando el pago con Mercado Pago...'

    const checkoutWindow = window.open('', '_blank')
    if (checkoutWindow) {
      checkoutWindow.opener = null
      checkoutWindow.document.write(
        '<p style="font-family: sans-serif; padding: 24px;">Preparando el pago con Mercado Pago...</p>'
      )
    }

    try {
      const purchase = await Api.buyCredits(plan.id)
      const checkoutUrl = safeUrl(purchase && purchase.checkoutUrl)
      if (!checkoutUrl) throw new Error('No recibimos el link de pago. Probá de nuevo.')

      // localStorage (y no sessionStorage) porque Mercado Pago vuelve en la pestaña nueva,
      // y sessionStorage es propio de cada pestaña.
      localStorage.setItem(
        PENDING_PURCHASE_KEY,
        JSON.stringify({ plan: plan.id, creditsBefore: creatorProfile.credits })
      )

      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.href = checkoutUrl
        statusEl.textContent =
          'Abrimos Mercado Pago en una pestaña nueva. Cuando termines el pago, el resultado se muestra ahí.'
      } else {
        // El navegador bloqueó la pestaña nueva: se ofrece el link para abrirla a mano.
        statusEl.innerHTML = `Tu navegador bloqueó la ventana de pago. <a href="${escapeHtml(checkoutUrl)}" target="_blank" rel="noopener">Abrir Mercado Pago ↗</a>`
      }
      backBtn.textContent = 'Cerrar'
      backBtn.disabled = false
      backBtn.replaceWith(backBtn.cloneNode(true))
      document.getElementById('credit-purchase-back').addEventListener('click', () => Modal.close())
    } catch (err) {
      if (checkoutWindow) checkoutWindow.close()
      statusEl.textContent = err.message
      confirmBtn.disabled = false
      backBtn.disabled = false
    }
  }

  // ---- Mensajes del resultado del pago (los muestra handlePaymentReturn) ----

  // PAGO REALIZADO: Mercado Pago aprobó el pago y el backend ya acreditó los créditos.
  function showSuccessStep(plan) {
    const html = `
      <div class="purchase-confirmed">
        <div class="purchase-confirmed__icon">${Icons.check}</div>
        <h4>¡Pago realizado!</h4>
        <p>
          ${
            plan
              ? 'Sumamos ' + (plan.raffles === 1 ? '1 rifa' : plan.raffles + ' rifas') + ' a tu cuenta.'
              : 'Ya sumamos los créditos a tu cuenta.'
          }
          Ya podés publicar una rifa nueva desde "Crear rifa".
        </p>
        <button class="btn btn-primary" id="credit-purchase-done">Listo</button>
      </div>
    `
    Modal.open('Pago realizado', html)
    document.getElementById('credit-purchase-done').addEventListener('click', () => Modal.close())
  }

  // PAGO PENDIENTE. Hay dos casos:
  //  - 'waiting': Mercado Pago dejó el pago pendiente (por ejemplo, un pago en efectivo que todavía no se hizo).
  //  - 'crediting': el pago se aprobó pero los créditos todavía no aparecen (el aviso al backend tarda unos segundos).
  function showPaymentPendingStep(reason) {
    const text =
      reason === 'crediting'
        ? 'Recibimos tu pago, pero los créditos todavía no figuran en tu cuenta. Aparecen apenas Mercado Pago le confirma el pago a nuestro sistema (puede tardar unos minutos). No hace falta que vuelvas a pagar.'
        : 'Mercado Pago todavía no confirmó el pago. Apenas lo apruebe, los créditos se suman solos a tu cuenta. No hace falta que vuelvas a pagar.'
    const html = `
      <div class="purchase-confirmed">
        <div class="purchase-confirmed__icon purchase-confirmed__icon--pending">${Icons.clock}</div>
        <h4>Pago pendiente</h4>
        <p>${text}</p>
        <button class="btn btn-primary" id="credit-purchase-done">Entendido</button>
      </div>
    `
    Modal.open('Pago pendiente', html)
    document.getElementById('credit-purchase-done').addEventListener('click', () => Modal.close())
  }

  // PAGO RECHAZADO: el pago no se completó (rechazado, cancelado o abandonado). No se cobra nada.
  function showPaymentFailedStep() {
    const html = `
      <div class="purchase-confirmed">
        <div class="purchase-confirmed__icon purchase-confirmed__icon--error">${Icons.close}</div>
        <h4>Pago rechazado</h4>
        <p>No se pudo completar el pago y no se te cobró nada. Podés intentarlo de nuevo con otro medio de pago cuando quieras.</p>
        <div class="purchase-actions">
          <button class="btn btn-secondary" id="credit-purchase-cancel">Cerrar</button>
          <button class="btn btn-primary" id="credit-purchase-retry">Volver a intentar</button>
        </div>
      </div>
    `
    Modal.open('Pago rechazado', html)
    document.getElementById('credit-purchase-cancel').addEventListener('click', () => Modal.close())
    document.getElementById('credit-purchase-retry').addEventListener('click', () => openBuyCreditsModal(null))
  }

  // Consulta el saldo cada 3 segundos (hasta 30) esperando que el backend acredite la compra.
  async function waitForCredits(creditsBefore) {
    if (creditsBefore === null) {
      await loadCreatorProfile(true).catch(() => {})
      return false
    }
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        await loadCreatorProfile(true)
        if (creatorProfile.credits > creditsBefore) return true
      } catch (err) {
        // se reintenta en la próxima vuelta
      }
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
    return false
  }

  // Mercado Pago devuelve al usuario a me.html?pago=ok | error | pendiente
  async function handlePaymentReturn(rawResult) {
    const result = String(rawResult).toLowerCase()
    let pending = null
    try {
      pending = JSON.parse(localStorage.getItem(PENDING_PURCHASE_KEY))
    } catch (err) {
      pending = null
    }
    localStorage.removeItem(PENDING_PURCHASE_KEY)
    const plan = pending ? pricingPlans.find((p) => p.id === pending.plan) : null

    if (result === 'error') {
      showPaymentFailedStep()
      return
    }
    if (result === 'pendiente') {
      showPaymentPendingStep('waiting')
      return
    }
    if (result !== 'ok') return // valor desconocido: no se muestra nada

    let closedByUser = false
    Modal.open(
      'Confirmando tu pago',
      '<div class="purchase-confirmed"><p>Estamos confirmando el pago con Mercado Pago. Esto puede tardar unos segundos...</p></div>',
      () => {
        closedByUser = true
      }
    )

    const credited = await waitForCredits(pending && typeof pending.creditsBefore === 'number' ? pending.creditsBefore : null)
    renderCreditBalance()
    if (window.refreshCreateRaffleCredits) window.refreshCreateRaffleCredits()
    if (closedByUser) return

    if (credited) showSuccessStep(plan)
    else showPaymentPendingStep('crediting')
  }

  // -------- Lista de rifas --------
  function renderRaffles() {
    rafflesList.innerHTML = ''

    if (myRafflesData.length === 0) {
      rafflesList.innerHTML = '<p class="validator-empty">Todavía no publicaste ninguna rifa.</p>'
      return
    }

    myRafflesData.forEach((raffle) => {
      const progress = raffle.totalNumbers > 0 ? Math.round((raffle.sold / raffle.totalNumbers) * 100) : 0
      const toneByStatus = { ACTIVA: 'badge-success', CERRADA: 'badge-neutral', EXPIRADA: 'badge-danger' }
      const closeButtonHTML =
        raffle.status === 'ACTIVA'
          ? `<button class="btn btn-secondary" data-close-raffle="${escapeHtml(raffle.slug)}">Cerrar rifa</button>`
          : ''
      const viewLinkHTML =
        raffle.status === 'ACTIVA' && creatorProfile.slug
          ? `<a class="raffle-card__view-link" href="rifa.html?creador=${encodeURIComponent(creatorProfile.slug)}&rifa=${encodeURIComponent(raffle.slug)}">Ver página pública ↗</a>`
          : ''
      const daysLeftLabel = raffle.status === 'ACTIVA' ? `${raffle.daysLeft} días restantes` : 'Finalizada'

      const card = document.createElement('div')
      card.className = 'raffle-card reveal'
      card.innerHTML = `
        <div class="raffle-card__header">
          <h3>${escapeHtml(raffle.title)}</h3>
        </div>
        <div class="raffle-card__status-row">
          <span class="badge badge--sm ${toneByStatus[raffle.status] || 'badge-neutral'}">${escapeHtml(raffle.status)}</span>
          <span class="raffle-card__days-left">${daysLeftLabel}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-label">
          <span>${raffle.sold} / ${raffle.totalNumbers} números vendidos</span>
          <span>${progress}%</span>
        </div>
        <div class="raffle-card__footer-actions">
          ${viewLinkHTML}
          ${closeButtonHTML}
        </div>
      `
      rafflesList.appendChild(card)
    })

    rafflesList.querySelectorAll('[data-close-raffle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true
        try {
          await Api.closeRaffle(btn.dataset.closeRaffle)
          await loadRaffles()
        } catch (err) {
          btn.disabled = false
          showErrorModal(err.message, 'No se pudo cerrar la rifa')
        }
      })
    })

    if (window.observeReveals) window.observeReveals(rafflesList)
  }

  // Trae las rifas del creador (RifaResumenDto) y las pasa al formato que usa esta pantalla.
  async function loadRaffles() {
    try {
      const raffles = await Api.getMyRaffles()
      myRafflesData = raffles.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.titulo,
        status: r.estado,
        totalNumbers: r.totalNumeros,
        sold: r.numerosVendidos,
        daysLeft: r.diasRestantes,
      }))
      renderRaffles()
    } catch (err) {
      rafflesList.innerHTML = `<p class="validator-empty">${escapeHtml(err.message)}</p>`
    }
  }

  window.renderMyRaffles = renderRaffles
  window.refreshRafflesPanel = async function () {
    try {
      await loadCreatorProfile(true)
      renderCreditBalance()
    } catch (err) {
      // se deja el saldo anterior
    }
    await loadRaffles()
  }

  // -------- Arranque --------
  creditContainer.innerHTML = '<p class="validator-empty">Cargando tus créditos...</p>'
  rafflesList.innerHTML = '<p class="validator-empty">Cargando tus rifas...</p>'

  try {
    await loadCreatorProfile()
    renderCreditBalance()
  } catch (err) {
    creditContainer.innerHTML = `<p class="validator-empty">${escapeHtml(err.message)}</p>`
  }
  await loadRaffles()

  const params = new URLSearchParams(window.location.search)

  // Volvemos de Mercado Pago: se muestra el resultado y se limpia la URL.
  const paymentResult = params.get('pago')
  if (paymentResult) {
    params.delete('pago')
    const cleanQuery = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (cleanQuery ? '?' + cleanQuery : ''))
    handlePaymentReturn(paymentResult)
    return
  }

  // Si venimos de "Elegí un plan" en la landing (login.html?plan=...), el plan llega por la URL
  // o, si el usuario pasó por Google, por sessionStorage (ahí se pierde el parámetro).
  const preselectedPlan = params.get('plan') || sessionStorage.getItem(PENDING_PLAN_KEY)
  sessionStorage.removeItem(PENDING_PLAN_KEY)
  if (preselectedPlan && pricingPlans.some((p) => p.id === preselectedPlan)) {
    openBuyCreditsModal(preselectedPlan)
  }
})
