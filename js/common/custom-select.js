// Convierte cualquier <select data-custom-select> en un botón + menú
// desplegable con el mismo estilo que "Opciones" (ver css/custom-select.css).
// El <select> original queda en el DOM, visualmente oculto pero funcional:
// cualquier código que ya lea su .value o escuche "change" sigue andando
// igual, sin tocar nada.
function enhanceCustomSelects(root) {
  const scope = root || document

  scope.querySelectorAll('select[data-custom-select]').forEach((select) => {
    if (select.dataset.enhanced === 'true') return
    select.dataset.enhanced = 'true'

    const wrapper = document.createElement('div')
    wrapper.className = 'custom-select'

    select.classList.add('custom-select__native')
    select.parentNode.insertBefore(wrapper, select)
    wrapper.appendChild(select)

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'custom-select__toggle'
    toggle.innerHTML = `<span class="custom-select__value"></span>${Icons.chevronDown}`
    wrapper.appendChild(toggle)

    const menu = document.createElement('div')
    menu.className = 'custom-select__menu'
    wrapper.appendChild(menu)

    function renderOptions() {
      menu.innerHTML = Array.from(select.options)
        .map(
          (opt) =>
            `<button type="button" class="custom-select__option ${opt.value === select.value ? 'is-selected' : ''}" data-value="${opt.value}">${opt.textContent}</button>`
        )
        .join('')

      menu.querySelectorAll('.custom-select__option').forEach((btn) => {
        btn.addEventListener('click', () => {
          select.value = btn.dataset.value
          select.dispatchEvent(new Event('change', { bubbles: true }))
          syncValue()
          closeMenu()
        })
      })
    }

    function syncValue() {
      const selected = select.options[select.selectedIndex]
      toggle.querySelector('.custom-select__value').textContent = selected ? selected.textContent : ''
      renderOptions()
    }

    function openMenu() {
      wrapper.classList.add('is-open')
      document.addEventListener('click', onOutsideClick)
    }

    function closeMenu() {
      wrapper.classList.remove('is-open')
      document.removeEventListener('click', onOutsideClick)
    }

    function onOutsideClick(e) {
      if (!wrapper.contains(e.target)) closeMenu()
    }

    toggle.addEventListener('click', () => {
      if (wrapper.classList.contains('is-open')) {
        closeMenu()
      } else {
        openMenu()
      }
    })

    syncValue()
  })
}

window.enhanceCustomSelects = enhanceCustomSelects

document.addEventListener('DOMContentLoaded', () => enhanceCustomSelects(document))
