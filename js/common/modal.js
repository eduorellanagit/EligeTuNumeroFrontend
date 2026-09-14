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

  function setBody(html) {
    if (bodyEl) bodyEl.innerHTML = html
  }

  function close() {
    if (!overlay) return
    overlay.classList.remove('is-open')
    if (onCloseCallback) onCloseCallback()
  }

  document.addEventListener('DOMContentLoaded', init)

  return { open, close, setBody }
})()
