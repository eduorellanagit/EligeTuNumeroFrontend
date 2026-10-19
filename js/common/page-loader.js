// Pantalla de carga de pantalla completa (#page-loader, ver me.html y rifa.html).
// Cada página avisa con PageLoader.done() cuando ya pintó sus datos iniciales. El loader se
// quita recién cuando pasó el tiempo mínimo y como muy tarde al llegar al máximo
// (PAGE_LOADER_MIN_MS / PAGE_LOADER_MAX_MS en js/config.js). Los tiempos se cuentan desde que
// empezó a cargar la página.
const PageLoader = (function () {
  const loaderEl = document.getElementById('page-loader')
  let finished = false

  function hide() {
    if (finished || !loaderEl) return
    finished = true
    loaderEl.classList.add('is-hidden')
    // Se saca del DOM cuando termina el fundido.
    setTimeout(() => loaderEl.remove(), 400)
  }

  function done() {
    if (finished) return
    const elapsed = performance.now()
    setTimeout(hide, Math.max(0, PAGE_LOADER_MIN_MS - elapsed))
  }

  if (!loaderEl) return { done }
  if (!PAGE_LOADER_ENABLED) {
    loaderEl.remove()
    return { done }
  }

  // Por seguridad: si la página nunca avisa, igual se quita al llegar al máximo.
  setTimeout(hide, Math.max(0, PAGE_LOADER_MAX_MS - performance.now()))
  return { done }
})()
