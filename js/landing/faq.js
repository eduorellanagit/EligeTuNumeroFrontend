// Acordeón de preguntas frecuentes. Cada .faq-item trae su pregunta y respuesta
// ya escritas en el HTML; acá solo se maneja qué está abierto. Todo el
// rectángulo es clickeable, no solo el texto de la pregunta.
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.faq-item')

  items.forEach((item) => {
    const question = item.querySelector('.faq-item__question')
    const icon = item.querySelector('.faq-item__icon')

    item.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open')

      // Cerrar los demás para que la lista no crezca sin control.
      items.forEach((other) => {
        other.classList.remove('is-open')
        other.querySelector('.faq-item__icon').textContent = '+'
        other.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false')
      })

      if (!isOpen) {
        item.classList.add('is-open')
        icon.textContent = '−'
        question.setAttribute('aria-expanded', 'true')
      }
    })
  })
})
