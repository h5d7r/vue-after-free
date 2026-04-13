type RenderedTextOptions = {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  locale?: string
}

function normalizeRenderLocale (locale?: string) {
  return (locale || 'en').toLowerCase().replace(/_/g, '-').split('-')[0] || 'en'
}

function escapeSvgText (text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function pickFontFamily (locale?: string) {
  const lang = normalizeRenderLocale(locale)

  if (lang === 'ar') return '"Noto Sans Arabic","DejaVu Sans",sans-serif'
  if (lang === 'ja' || lang === 'ko' || lang === 'zh') return '"Noto Sans CJK","Noto Sans","DejaVu Sans",sans-serif'

  return '"DejaVu Sans","Arial",sans-serif'
}

function estimateTextWidth (text: string, fontSize: number) {
  let units = 0

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)

    if (text[i] === ' ') units += 0.35
    else if (code > 0xff) units += 0.95
    else if (code >= 0xc0) units += 0.7
    else units += 0.58
  }

  return units * fontSize
}

function fitFontSize (text: string, width: number, requestedSize: number) {
  let size = requestedSize
  const maxWidth = Math.max(width - 20, 20)

  while (size > 12 && estimateTextWidth(text, size) > maxWidth) {
    size -= 1
  }

  return size
}

export function shouldRenderTextAsImage (text: string, locale?: string) {
  const lang = normalizeRenderLocale(locale)

  if (['ar', 'de', 'ja', 'ko', 'zh'].indexOf(lang) >= 0) return true
  return /[\u0600-\u06ff\u0750-\u08ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(text)
}

export function buildRenderedTextUrl (options: RenderedTextOptions) {
  const width = Math.max(1, Math.round(options.width))
  const height = Math.max(1, Math.round(options.height))
  const text = options.text || ''
  const locale = normalizeRenderLocale(options.locale)
  const direction = locale === 'ar' ? 'rtl' : 'ltr'
  const color = options.color || '#ffffff'
  const align = options.align || 'left'
  const fontSize = fitFontSize(text, width, options.fontSize || 28)

  let x = 12
  let anchor = 'start'

  if (align === 'center') {
    x = width / 2
    anchor = 'middle'
  } else if (align === 'right') {
    x = width - 12
    anchor = 'end'
  }

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">',
    '<text x="' + x + '" y="' + (height / 2) + '" fill="' + color + '" font-size="' + fontSize + '" font-family="' + pickFontFamily(locale) + '" text-anchor="' + anchor + '" dominant-baseline="middle" direction="' + direction + '" unicode-bidi="plaintext">' + escapeSvgText(text) + '</text>',
    '</svg>'
  ].join('')

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export function createRenderedTextImage (options: RenderedTextOptions) {
  return new Image({
    url: buildRenderedTextUrl(options),
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height
  })
}

export function updateRenderedTextImage (image: Image, options: RenderedTextOptions) {
  image.url = buildRenderedTextUrl(options)
  image.x = options.x
  image.y = options.y
  image.width = options.width
  image.height = options.height
}
