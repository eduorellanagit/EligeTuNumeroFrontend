// Controlador genérico de modal. Cada página que necesite un modal debe traer
// el markup de #modal-overlay (ver index.html / me.html / rifa.html) y este script.
// Uso: Modal.open('Título', '<p>contenido html</p>'); Modal.close();
const Modal = (function () {
  let overlay, titleEl, bodyEl, closeBtn
  let onCloseCallback = null

  function init() {
    overlay = document.getElementById('modal-overlay')
    if (!overlay) return
    titleEl = document.getElementById('modal-title')
    bodyEl = document.getElementById('modal-body')
    closeBtn = document.getElementById('modal-close-btn')

    closeBtn.addEventListener('click', close)
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close()
    })
  }

  function open(title, html, onClose) {
    if (!overlay) return
    titleEl.textContent = title
    bodyEl.innerHTML = html
    overlay.classList.add('is-open')
    onCloseCallback = onClose || null
  }

  function close() {
    if (!overlay) return
    overlay.classList.remove('is-open')
    if (onCloseCallback) onCloseCallback()
  }

  function escape(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Aviso con la misma estructura que el modal de "Desactivar cuenta": solo título y texto
  // (sin ícono) y dos botones iguales. El de la izquierda cierra; el de la derecha (azul) acepta.
  //   paragraphs: lista de párrafos; cada uno es un texto o una lista de textos (una línea cada uno).
  //   options: { closeLabel, acceptLabel, onAccept, onClose, buttons: false (sin botones) }
  function notice(title, paragraphs, options) {
    const opts = options || {}
    const html = paragraphs
      .map((p) => '<p>' + (Array.isArray(p) ? p.map(escape).join('<br>') : escape(p)) + '</p>')
      .join('')
    const buttons =
      opts.buttons === false
        ? ''
        : `<div class="detail-actions detail-actions--equal">
            <button class="btn btn-secondary" type="button" data-notice="close">${escape(opts.closeLabel || 'Cerrar')}</button>
            <button class="btn btn-primary" type="button" data-notice="accept">${escape(opts.acceptLabel || 'Aceptar')}</button>
          </div>`
    open(title, `<div class="modal-message modal-message--notice">${html}${buttons}</div>`, opts.onClose)
    if (opts.buttons === false) return
    bodyEl.querySelector('[data-notice="close"]').addEventListener('click', close)
    bodyEl.querySelector('[data-notice="accept"]').addEventListener('click', () => {
      if (opts.onAccept) {
        // el modal se cierra primero para que onAccept pueda abrir otro
        const keep = onCloseCallback
        onCloseCallback = null
        overlay.classList.remove('is-open')
        opts.onAccept()
        if (keep && !overlay.classList.contains('is-open')) keep()
      } else {
        close()
      }
    })
  }

  document.addEventListener('DOMContentLoaded', init)

  return { open, close, notice }
})()
