interface Zoom {
  image: HTMLImageElement
  clone: HTMLImageElement
  overlay: HTMLDivElement
  settleTimer?: number
}

const ZOOM_MARGIN = 32
const VIEWPORT_FILL = 0.9
const DURATION_MS = 300
const EASING = 'cubic-bezier(0.24, 0.25, 0.05, 1)'
// the page header must use z-40 or higher. an open zoom is above it, a closing zoom is below it
const Z_INDEX_OPEN = 61
const Z_INDEX_CLOSING = 39
const TAG_ATTRIBUTE = 'data-image-zoom'
// only images in an article zoom. images in the nav, the footer and other page parts do not zoom
const ZOOMABLE_IMAGES = 'article img'

export const attachImageZoom = (): (() => void) => {
  let current: Zoom | null = null
  // keep each zoom until its clone is removed. an image that opens during close reverses its clone
  const zooms = new WeakMap<HTMLImageElement, Zoom>()

  const tag = (image: HTMLImageElement) => {
    if (!image.matches(ZOOMABLE_IMAGES) || image.closest('a') || image.naturalWidth === 0) return
    const rect = image.getBoundingClientRect()
    // a hidden image has no size yet, so tag it and let open check it. a resize does not tag again
    const isHidden = rect.width === 0 || rect.height === 0
    if (!isHidden && getScale(image, rect) <= 1) return
    image.setAttribute(TAG_ATTRIBUTE, '')
    image.setAttribute('role', 'button')
    image.setAttribute('aria-label', image.alt ? `Zoom image: ${image.alt}` : 'Zoom image')
    image.setAttribute('aria-expanded', 'false')
    image.tabIndex = 0
    image.style.cursor = 'zoom-in'
  }

  const open = (image: HTMLImageElement) => {
    const rect = image.getBoundingClientRect()
    // a remote image without dimensions is 0x0 until it loads. then the scale is NaN
    if (rect.width === 0 || rect.height === 0) return
    const scale = getScale(image, rect)
    if (scale <= 1) return
    const zoom = zooms.get(image) ?? createZoom({ image, rect, duration: getDuration() })
    if (!zooms.has(image)) {
      zoom.overlay.addEventListener('click', closeAnimated)
      zooms.set(image, zoom)
    }
    window.clearTimeout(zoom.settleTimer)
    current = zoom
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2)
    const dy = window.innerHeight / 2 - (rect.top + rect.height / 2)
    zoom.clone.style.zIndex = `${Z_INDEX_OPEN}`
    zoom.clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
    zoom.overlay.style.zIndex = `${Z_INDEX_OPEN - 1}`
    zoom.overlay.style.opacity = '1'
    zoom.overlay.style.pointerEvents = 'auto'
    image.setAttribute('aria-expanded', 'true')
  }

  const close = (isInstant = false) => {
    const zoom = current
    if (!zoom) return
    current = null
    // move below the header immediately, so the stack order does not change during the transition
    zoom.clone.style.zIndex = `${Z_INDEX_CLOSING}`
    zoom.clone.style.transform = ''
    zoom.overlay.style.zIndex = `${Z_INDEX_CLOSING - 1}`
    zoom.overlay.style.opacity = '0'
    zoom.overlay.style.pointerEvents = 'none'
    zoom.image.setAttribute('aria-expanded', 'false')
    const settle = () => {
      zoom.clone.remove()
      zoom.overlay.remove()
      zoom.image.style.opacity = ''
      zooms.delete(zoom.image)
    }
    const duration = isInstant ? 0 : getDuration()
    if (duration === 0) settle()
    else zoom.settleTimer = window.setTimeout(settle, duration)
  }

  const closeAnimated = () => close()
  const closeInstantly = () => close(true)

  const handleClick = (event: MouseEvent) => {
    const image = event.target
    if (!(image instanceof HTMLImageElement) || !image.hasAttribute(TAG_ATTRIBUTE)) return
    open(image)
  }

  // any key closes the zoom. this stops a shortcut such as search from opening below the overlay
  const handleKeyDown = (event: KeyboardEvent) => {
    const image = event.target
    const isToggleKey = event.key === 'Enter' || event.key === ' '
    if (current) {
      if (isToggleKey && image === current.image) event.preventDefault()
      close()
      return
    }
    if (!isToggleKey || !(image instanceof HTMLImageElement)) return
    if (!image.hasAttribute(TAG_ATTRIBUTE)) return
    event.preventDefault()
    open(image)
  }

  // the load event does not bubble. a capture listener gets lazy loads and replaced images
  const handleLoad = (event: Event) => {
    if (event.target instanceof HTMLImageElement) tag(event.target)
  }

  for (const image of document.querySelectorAll<HTMLImageElement>(ZOOMABLE_IMAGES)) {
    if (image.complete) tag(image)
  }
  document.addEventListener('click', handleClick)
  document.addEventListener('load', handleLoad, true)
  document.addEventListener('keydown', handleKeyDown)
  // a scroll closes with the animation. other changes close immediately, because the layout moves
  window.addEventListener('scroll', closeAnimated, { passive: true })
  window.addEventListener('resize', closeInstantly)
  window.addEventListener('popstate', closeInstantly)
  window.addEventListener('beforeprint', closeInstantly)

  return () => {
    closeInstantly()
    document.removeEventListener('click', handleClick)
    document.removeEventListener('load', handleLoad, true)
    document.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('scroll', closeAnimated)
    window.removeEventListener('resize', closeInstantly)
    window.removeEventListener('popstate', closeInstantly)
    window.removeEventListener('beforeprint', closeInstantly)
  }
}

const getScale = (image: HTMLImageElement, rect: DOMRect) => {
  const fitScale =
    VIEWPORT_FILL *
    Math.min(
      (window.innerWidth - ZOOM_MARGIN * 2) / rect.width,
      (window.innerHeight - ZOOM_MARGIN * 2) / rect.height
    )
  // a vector image is sharp at all sizes. only raster images have a limit at their real resolution
  const isVector = /\.svg(\?|#|$)/i.test(image.currentSrc || image.src)
  return isVector ? fitScale : Math.min(fitScale, image.naturalWidth / rect.width)
}

const getDuration = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DURATION_MS

const createZoom = ({
  image,
  rect,
  duration,
}: {
  image: HTMLImageElement
  rect: DOMRect
  duration: number
}): Zoom => {
  const overlay = document.createElement('div')
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'var(--background)',
    opacity: '0',
    cursor: 'zoom-out',
    transition: `opacity ${duration}ms ${EASING}`,
  })

  const clone = document.createElement('img')
  clone.src = image.currentSrc || image.src
  clone.alt = ''
  clone.setAttribute('aria-hidden', 'true')
  const { borderRadius, objectFit } = window.getComputedStyle(image)
  Object.assign(clone.style, {
    // use page coordinates, so the clone moves with the page during close
    position: 'absolute',
    top: '0',
    left: '0',
    margin: '0',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    maxWidth: 'none',
    borderRadius,
    objectFit,
    // the overlay gets the clicks and closes the zoom
    pointerEvents: 'none',
    transition: `transform ${duration}ms ${EASING}`,
  })

  document.body.append(overlay, clone)
  // measure the containing block origin, so a positioned or offset body does not move the clone
  const origin = clone.getBoundingClientRect()
  clone.style.top = `${rect.top - origin.top}px`
  clone.style.left = `${rect.left - origin.left}px`
  image.style.opacity = '0'
  // read the layout to apply the start state. then the first transform and opacity changes animate
  clone.getBoundingClientRect()
  return { image, clone, overlay }
}
