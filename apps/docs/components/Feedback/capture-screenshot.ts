import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'

import { REDACT_SELECTOR } from './dom-snapshot'

export interface ScreenRect {
  left: number
  top: number
  width: number
  height: number
}

const intersect = (a: ScreenRect, b: ScreenRect): ScreenRect | null => {
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const width = Math.min(a.left + a.width, b.left + b.width) - left
  const height = Math.min(a.top + a.height, b.top + b.height) - top
  return width > 0 && height > 0 ? { left, top, width, height } : null
}

export const captureScreenshot = async (selection: ScreenRect): Promise<File | null> => {
  const content = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
  if (!content) return null
  const contentRect = content.getBoundingClientRect()
  const area = intersect(selection, contentRect)
  if (!area) return null

  const pixelRatio = Math.min(window.devicePixelRatio, 2)
  const { toCanvas } = await import('html-to-image')
  // the svg is only as big as the selection, and the content moves so the selection starts at 0,0
  const canvas = await toCanvas(content, {
    width: area.width,
    height: area.height,
    pixelRatio,
    // a transparent pixel replaces images that cross-origin rules stop the capture from reading
    imagePlaceholder:
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    style: {
      width: `${contentRect.width}px`,
      height: `${contentRect.height}px`,
      margin: '0',
      transform: `translate(${contentRect.left - area.left}px, ${contentRect.top - area.top}px)`,
    },
  })

  // redacted regions can hold project data, so the capture fails rather than skip the mask
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = 'black'
  content.querySelectorAll(REDACT_SELECTOR).forEach((element) => {
    const redacted = intersect(area, element.getBoundingClientRect())
    if (!redacted) return
    context.fillRect(
      (redacted.left - area.left) * pixelRatio,
      (redacted.top - area.top) * pixelRatio,
      redacted.width * pixelRatio,
      redacted.height * pixelRatio
    )
  })

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob ? new File([blob], 'screenshot.png', { type: 'image/png' }) : null
}
