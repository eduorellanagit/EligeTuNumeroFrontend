// Validaciones de formularios: reflejan las del backend para avisar antes de enviar.
// Cada función devuelve un texto de error, o '' si el valor es válido.
const Validate = {
  PERSON_NAME: /^(?=.*\p{Script=Latin})[\p{Script=Latin} '’-]+$/u,
  WHATSAPP: /^(?=(?:\D*\d){8,})\+?[0-9 ()-]{8,30}$/,
  ALIAS: /^[A-Za-z0-9.-]{6,20}$/,
  ADDRESS: /^[\p{L}0-9 .,#°/'’-]+$/u,

  personName(value, label) {
    const v = String(value || '')
    if (!v.trim()) return `Completá ${label}.`
    if (v.length > 120 || !Validate.PERSON_NAME.test(v.trim())) return `${label[0].toUpperCase() + label.slice(1)} solo puede tener letras (máx. 120).`
    return ''
  },
  dni(value) {
    return /^\d{7,8}$/.test(String(value || '').trim()) ? '' : 'El DNI debe tener 7 u 8 dígitos (sin puntos).'
  },
  whatsapp(value) {
    return Validate.WHATSAPP.test(String(value || '').trim()) ? '' : 'El WhatsApp no es válido. Ejemplo: 3813401680'
  },
  cbu(value) {
    return /^\d{22}$/.test(String(value || '').trim()) ? '' : 'El CBU / CVU debe tener 22 dígitos.'
  },
  alias(value) {
    return Validate.ALIAS.test(String(value || '').trim())
      ? ''
      : 'El alias debe tener de 6 a 20 caracteres: letras, números, punto o guion.'
  },
  address(value) {
    const v = String(value || '').trim()
    if (!v) return 'Completá tu domicilio.'
    if (v.length > 100 || !Validate.ADDRESS.test(v)) return 'El domicilio tiene caracteres no permitidos o supera los 100.'
    return ''
  },
  // Largo entre min y max (sin contar espacios al inicio/final).
  length(value, min, max, label) {
    const n = String(value || '').trim().length
    if (n < min || n > max) return `${label} debe tener entre ${min} y ${max} caracteres (ahora: ${n}).`
    return ''
  },
}

// Contador "n / max" bajo un campo (input o textarea). Devuelve la función que lo actualiza.
function attachCounter(el, min, max) {
  let counter = el.parentElement.querySelector('.char-counter')
  if (!counter) {
    counter = document.createElement('small')
    counter.className = 'char-counter'
    el.insertAdjacentElement('afterend', counter)
  }
  const update = () => {
    const n = el.value.trim().length
    counter.textContent = `${n} / ${max} (mín. ${min})`
    counter.classList.toggle('is-bad', n > 0 && (n < min || n > max))
  }
  el.addEventListener('input', update)
  update()
  return update
}
