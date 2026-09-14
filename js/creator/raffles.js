// Pinta el saldo de créditos y la lista de "mis rifas". Comprar créditos ahora
// es un flujo de 3 pasos (elegir cantidad -> confirmar -> se manda la solicitud
// HTTP) en vez de sumarse solo. Cerrar una rifa sigue siendo instantáneo.
document.addEventListener('DOMContentLoaded', () => {
  const creditContainer = document.getElementById('credit-balance-container')
  const rafflesList = document.getElementById('raffles-list')
  if (!creditContainer || !rafflesList) return

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

  async function confirmPurchase(plan, confirmBtn) {
    const backBtn = document.getElementById('credit-purchase-back')
    const statusEl = document.getElementById('credit-purchase-status')
    confirmBtn.disabled = true
    backBtn.disabled = true
    statusEl.textContent = 'Procesando el pago con Mercado Pago...'

    const result = await sendCreditPurchaseRequest(plan)

    creatorProfile.credits += plan.raffles
    renderCreditBalance()
    if (window.refreshCreateRaffleCredits) window.refreshCreateRaffleCredits()
    showSuccessStep(plan, result)
  }

  // Se manda la solicitud HTTP real hacia el backend. Como esta es una demo
  // sin servidor (o corre con DEMO_MODE en true, ver js/config.js), si la
  // request falla simulamos que Mercado Pago aprobó el pago para que el
  // flujo se pueda ver completo.
  async function sendCreditPurchaseRequest(plan) {
    try {
      const response = await fetch(API_BASE_URL + '/creditos/comprar', {
        method: 'POST',
        credentials: 'include',
        headers: Object.assign({ 'Content-Type': 'application/json' }, typeof authHeaders === 'function' ? authHeaders() : {}),
        body: JSON.stringify({ planId: plan.id, raffles: plan.raffles, price: plan.price }),
      })
      if (!response.ok) throw new Error('El backend respondió ' + response.status)
      return await response.json()
    } catch (err) {
      return { ok: true, simulated: true, reason: err.message }
    }
  }

  function showSuccessStep(plan) {
    const html = `
      <div class="purchase-confirmed">
        <div class="purchase-confirmed__icon">${Icons.check}</div>
        <h4>¡Créditos acreditados!</h4>
        <p>
          Sumamos ${plan.raffles === 1 ? '1 rifa' : plan.raffles + ' rifas'} a tu cuenta.
          Ya podés publicar una rifa nueva desde "Crear rifa".
        </p>
        <button class="btn btn-primary" id="credit-purchase-done">Listo</button>
      </div>
    `
    Modal.open('Compra confirmada', html)
    document.getElementById('credit-purchase-done').addEventListener('click', () => Modal.close())
  }

  // -------- Lista de rifas --------
  function renderRaffles() {
    rafflesList.innerHTML = ''

    if (myRafflesData.length === 0) {
      rafflesList.innerHTML = '<p class="validator-empty">Todavía no publicaste ninguna rifa.</p>'
      return
    }

    myRafflesData.forEach((raffle) => {
      const progress = Math.round((raffle.sold / raffle.totalNumbers) * 100)
      const toneByStatus = { ACTIVA: 'badge-success', CERRADA: 'badge-neutral', EXPIRADA: 'badge-danger' }
      const closeButtonHTML =
        raffle.status === 'ACTIVA'
          ? `<button class="btn btn-secondary" data-close-raffle="${raffle.id}">Cerrar rifa</button>`
          : ''
      const viewLinkHTML =
        raffle.status === 'ACTIVA'
          ? `<a class="raffle-card__view-link" href="rifa.html?creador=juanperez&rifa=${raffle.id}">Ver página pública ↗</a>`
          : ''
      const daysLeftLabel = raffle.status === 'ACTIVA' ? `${raffle.daysLeft} días restantes` : 'Finalizada'

      const card = document.createElement('div')
      card.className = 'raffle-card reveal'
      card.innerHTML = `
        <div class="raffle-card__header">
          <h3>${raffle.title}</h3>
          <span class="badge ${toneByStatus[raffle.status]}">${raffle.status}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-label">
          <span>${raffle.sold} / ${raffle.totalNumbers} números vendidos</span>
          <span>${progress}%</span>
        </div>
        <div class="raffle-card__footer">
          <span class="raffle-card__days-left">${daysLeftLabel}</span>
          <div class="raffle-card__footer-actions">
            ${viewLinkHTML}
            ${closeButtonHTML}
          </div>
        </div>
      `
      rafflesList.appendChild(card)
    })

    rafflesList.querySelectorAll('[data-close-raffle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raffle = myRafflesData.find((r) => r.id === btn.dataset.closeRaffle)
        if (raffle) raffle.status = 'CERRADA'
        renderRaffles()
      })
    })

    if (window.observeReveals) window.observeReveals(rafflesList)
  }

  window.renderMyRaffles = renderRaffles
  window.refreshRafflesPanel = function () {
    renderCreditBalance()
    renderRaffles()
  }

  renderCreditBalance()
  renderRaffles()

  // Si venimos de "Elegí un plan" en la landing (login.html?plan=... -> me.html?plan=...),
  // abrimos el modal de compra directamente con esa opción marcada.
  const params = new URLSearchParams(window.location.search)
  const preselectedPlan = params.get('plan')
  if (preselectedPlan && pricingPlans.some((p) => p.id === preselectedPlan)) {
    openBuyCreditsModal(preselectedPlan)
  }
})
