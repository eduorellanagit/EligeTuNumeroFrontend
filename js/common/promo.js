// Cualquier elemento marcado con [data-promo] se muestra u oculta según
// PROMO_FREE_CREDIT_ACTIVE (ver js/config.js). Para bajar la promo cuando
// termine el lanzamiento, alcanza con cambiar ese flag a false — no hace
// falta tocar el HTML de la landing ni del login.
document.addEventListener('DOMContentLoaded', () => {
  const isActive = typeof PROMO_FREE_CREDIT_ACTIVE !== 'undefined' && PROMO_FREE_CREDIT_ACTIVE
  document.querySelectorAll('[data-promo]').forEach((el) => {
    el.style.display = isActive ? '' : 'none'
  })
})
