// Pinta los íconos que están escritos como <span data-icon="user"></span> en
// el HTML. Los íconos generados dentro de strings de JS (modales, pantallas
// de éxito) no pasan por acá: usan `${Icons.check}` directo.
function renderIconsIn(root) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const key = el.dataset.icon.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (Icons[key]) el.innerHTML = Icons[key]
  })
}
window.renderIconsIn = renderIconsIn

document.addEventListener('DOMContentLoaded', () => renderIconsIn(document))
