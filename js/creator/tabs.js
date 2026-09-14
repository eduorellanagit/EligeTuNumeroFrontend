// Cambia entre las 4 secciones del panel mostrando y ocultando los bloques
// .panel-section correspondientes. En celulares, las opciones quedan atrás
// de un botón "Opciones" en vez de mostrarse todas apretadas en una fila.
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.sidebar__tab')
  const sections = document.querySelectorAll('.panel-section')
  const toggleBtn = document.getElementById('sidebar-toggle-btn')
  const nav = document.getElementById('sidebar-nav')

  if (toggleBtn && nav) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open')
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
    })
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab

      tabs.forEach((t) => t.classList.remove('is-active'))
      tab.classList.add('is-active')

      sections.forEach((section) => {
        section.classList.toggle('is-active', section.dataset.section === target)
      })

      if (nav && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open')
        toggleBtn.setAttribute('aria-expanded', 'false')
      }
    })
  })
})
