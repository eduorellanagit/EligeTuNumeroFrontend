// Cambia entre las 3 secciones del panel (perfil / pagos / rifas) mostrando
// y ocultando los bloques .panel-section correspondientes.
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.sidebar__tab')
  const sections = document.querySelectorAll('.panel-section')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab

      tabs.forEach((t) => t.classList.remove('is-active'))
      tab.classList.add('is-active')

      sections.forEach((section) => {
        section.classList.toggle('is-active', section.dataset.section === target)
      })
    })
  })
})
