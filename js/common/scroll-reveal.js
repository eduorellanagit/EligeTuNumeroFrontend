// Animación al desplazarse por la página: cualquier elemento con clase
// "reveal" arranca invisible/corrido (ver css/animations.css) y pasa a su
// lugar apenas entra en pantalla. Cada uno se anima una sola vez.
//
// window.observeReveals(root) queda expuesta para volver a escanear después
// de que otro script reconstruya una lista con innerHTML (por ejemplo, al
// cerrar o publicar una rifa en js/creator/raffles.js) — si no, las tarjetas
// nuevas quedarían con opacity:0 para siempre, porque el observer original
// nunca las vio.
let revealObserver = null

function observeReveals(root) {
  const scope = root || document

  if (!('IntersectionObserver' in window)) {
    scope.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'))
    return
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
  }

  scope.querySelectorAll('.reveal:not(.is-visible)').forEach((item) => revealObserver.observe(item))
}

window.observeReveals = observeReveals

document.addEventListener('DOMContentLoaded', () => observeReveals(document))
