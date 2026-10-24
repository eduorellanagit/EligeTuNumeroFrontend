// "Descargar imagen": arma en un <canvas> una imagen vertical (1080×1920, formato historia) con el
// título, la descripción, el precio, la grilla de números con su estado actual y el link de la rifa,
// y la descarga como PNG. Todo pasa en el navegador, no se sube nada.
// El link de la imagen siempre usa el dominio público (eligetunumero.com), sin importar desde
// qué dirección se abrió la página.
const ShareImage = (function () {
  const W = 1080
  const H = 1920
  const FONT = 'Inter, "Segoe UI", Arial, sans-serif'
  const C = {
    bg: '#F5F7FB',
    primary: '#234DE0',
    text: '#4B5468',
    disponible: { bg: '#147A46', fg: '#FFFFFF' },
    reservado: { bg: '#B5720B', fg: '#FFFFFF' },
    pagado: { bg: '#7A8294', fg: '#FFFFFF' },
  }
  const PUBLIC_DOMAIN = 'eligetunumero.com'

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  function setFont(ctx, weight, size) {
    ctx.font = `${weight} ${size}px ${FONT}`
  }

  // Parte el texto en líneas que entren en maxWidth; si pasa de maxLines, corta con "…".
  function wrapText(ctx, text, maxWidth, maxLines) {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
    const lines = []
    let line = ''
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i]
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test
      } else {
        lines.push(line)
        line = words[i]
      }
    }
    if (line) lines.push(line)
    if (lines.length > maxLines) {
      lines.length = maxLines
      let last = lines[maxLines - 1]
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1)
      lines[maxLines - 1] = last.replace(/[\s.,;:]+$/, '') + '…'
    }
    return lines
  }

  // Achica la letra hasta que el texto entre en maxWidth (con un mínimo).
  function fitFont(ctx, text, weight, start, min, maxWidth) {
    let size = start
    setFont(ctx, weight, size)
    while (size > min && ctx.measureText(text).width > maxWidth) {
      size -= 2
      setFont(ctx, weight, size)
    }
    return size
  }

  async function loadFonts() {
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all(
          [500, 600, 700, 800].map((w) => document.fonts.load(`${w} 30px Inter`, 'Aá0123456789'))
        )
      }
    } catch (e) {
      // si no cargan, se usa la letra de reemplazo
    }
  }

  function formatPrice(value) {
    return '$' + Number(value).toLocaleString('es-AR') + ' por número'
  }

  function layoutFor(total) {
    // 30 → 6×5 · 60 → 10×6 · 100 → 10×10
    const cols = total <= 30 ? 6 : 10
    const rows = Math.ceil(total / cols)
    const gap = 8
    const cell = Math.min(Math.floor((800 - (cols - 1) * gap) / cols), 100)
    return { cols, rows, gap, cell }
  }

  async function render(raffle, ownerSlug, raffleId) {
    await loadFonts()
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, W, H)

    // --- medidas de cada bloque, para centrar todo en vertical
    const GAP = 36
    const maxW = 880

    let titleSize = fitFont(ctx, raffle.title, 800, 92, 56, maxW)
    let titleLines = [raffle.title]
    if (ctx.measureText(raffle.title).width > maxW) {
      // título muy largo: en dos líneas, con la letra más chica que entre
      titleSize = 68
      setFont(ctx, 800, titleSize)
      titleLines = wrapText(ctx, raffle.title, maxW, 2)
      const longest = titleLines.reduce((x, y) => (x.length > y.length ? x : y), '')
      titleSize = fitFont(ctx, longest, 800, titleSize, 40, maxW)
    }
    const titleLH = Math.round(titleSize * 1.12)
    const titleFont = ctx.font
    const titleH = titleLines.length * titleLH

    setFont(ctx, 500, 34)
    const descLines = wrapText(ctx, raffle.description, maxW, 4)
    const descLH = 46
    const descH = descLines.length * descLH

    const priceText = formatPrice(raffle.pricePerNumber)
    setFont(ctx, 800, 54)
    const priceW = Math.ceil(ctx.measureText(priceText).width) + 100
    const priceH = 100

    const lay = layoutFor(raffle.totalNumbers)
    const gridW = lay.cols * lay.cell + (lay.cols - 1) * lay.gap
    const gridH = lay.rows * lay.cell + (lay.rows - 1) * lay.gap

    const legendH = 28
    const ctaH = 236

    const total = titleH + descH + priceH + gridH + legendH + ctaH + GAP * 5
    let y = Math.max(60, Math.round((H - total) / 2))

    // --- título
    ctx.fillStyle = C.primary
    ctx.font = titleFont
    titleLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, y + titleLH * i + titleLH / 2)
    })
    y += titleH + GAP

    // --- descripción
    ctx.fillStyle = C.text
    setFont(ctx, 500, 34)
    descLines.forEach((line, i) => ctx.fillText(line, W / 2, y + descLH * i + descLH / 2))
    y += descH + GAP

    // --- precio
    ctx.fillStyle = C.primary
    roundRect(ctx, (W - priceW) / 2, y, priceW, priceH, 26)
    ctx.fill()
    ctx.fillStyle = '#fff'
    setFont(ctx, 800, 54)
    ctx.fillText(priceText, W / 2, y + priceH / 2 + 2)
    y += priceH + GAP

    // --- grilla de números con su estado
    const byNumber = {}
    raffle.numbers.forEach((n) => (byNumber[n.number] = n.status))
    const startX = (W - gridW) / 2
    const numSize = Math.round(lay.cell * 0.41)
    for (let i = 0; i < raffle.totalNumbers; i++) {
      const col = i % lay.cols
      const row = Math.floor(i / lay.cols)
      const x = startX + col * (lay.cell + lay.gap)
      const cy = y + row * (lay.cell + lay.gap)
      const palette = C[byNumber[i + 1]] || C.disponible
      ctx.fillStyle = palette.bg
      roundRect(ctx, x, cy, lay.cell, lay.cell, Math.round(lay.cell * 0.19))
      ctx.fill()
      ctx.fillStyle = palette.fg
      setFont(ctx, 700, numSize)
      ctx.fillText(String(i + 1), x + lay.cell / 2, cy + lay.cell / 2 + 1)
    }
    y += gridH + GAP

    // --- leyenda
    const items = [
      ['Disponible', C.disponible.fg],
      ['Reservado', C.reservado.fg],
      ['Pagado', C.pagado.bg],
    ]
    setFont(ctx, 600, 28)
    const widths = items.map(([label]) => 22 + 12 + ctx.measureText(label).width)
    const legendW = widths.reduce((a, b) => a + b, 0) + 44 * (items.length - 1)
    let lx = (W - legendW) / 2
    ctx.textAlign = 'left'
    items.forEach(([label, color], i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(lx + 11, y + legendH / 2, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = C.text
      setFont(ctx, 600, 28)
      ctx.fillText(label, lx + 34, y + legendH / 2 + 1)
      lx += widths[i] + 44
    })
    ctx.textAlign = 'center'
    y += legendH + GAP

    // --- cuadro azul con el link
    ctx.fillStyle = C.primary
    roundRect(ctx, 100, y, 880, ctaH, 32)
    ctx.fill()
    ctx.fillStyle = '#fff'
    setFont(ctx, 800, 50)
    ctx.fillText('Elegí tu número en:', W / 2, y + 36 + 30)
    ctx.fillStyle = '#fff'
    roundRect(ctx, 130, y + 36 + 60 + 20 - 10 + 2, 820, 86, 18)
    ctx.fill()
    const link = `${PUBLIC_DOMAIN}/rf/${ownerSlug}/${raffleId}`
    ctx.fillStyle = C.primary
    fitFont(ctx, link, 800, 40, 20, 780)
    ctx.fillText(link, W / 2, y + 36 + 60 + 20 - 10 + 2 + 43)

    return canvas
  }

  // Descarga la imagen y además la abre en una pestaña nueva.
  // Importante: la pestaña se abre ya mismo, dentro del clic (si se abriera después de generar la imagen,
  // el navegador la tomaría como ventana emergente y la bloquearía). Después se le pone la imagen.
  async function download(raffle, ownerSlug, raffleId) {
    let tab = null
    try {
      tab = window.open('', '_blank')
      if (tab) tab.document.title = 'Generando imagen...'
    } catch (err) {
      tab = null
    }

    let canvas
    try {
      canvas = await render(raffle, ownerSlug, raffleId)
    } catch (err) {
      if (tab) tab.close()
      throw err
    }

    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          if (tab) tab.close()
          return resolve()
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rifa-${ownerSlug}-${raffleId}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        if (tab && !tab.closed) {
          tab.location.href = url
        }
        // el link queda vivo un rato: la pestaña nueva lo necesita para mostrar la imagen
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000)
        resolve()
      }, 'image/png')
    })
  }

  return { download, render }
})()
