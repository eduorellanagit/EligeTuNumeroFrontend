// Recorta cualquier imagen al cuadrado (1:1), tomando el centro, y la
// devuelve como un dataURL liviano. Así, sin importar qué foto suba el
// creador, el premio siempre termina con una imagen 1x1 consistente.
function cropImageToSquare(dataUrl, callback, outputSize) {
  const SIZE = outputSize || 480
  const img = new Image()

  img.onload = () => {
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - side) / 2
    const sy = (img.naturalHeight - side) / 2

    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)

    callback(canvas.toDataURL('image/jpeg', 0.85))
  }

  img.onerror = () => {
    // Si por algún motivo no se puede procesar, usamos la imagen original
    // en vez de dejar al creador sin nada.
    callback(dataUrl)
  }

  img.src = dataUrl
}
