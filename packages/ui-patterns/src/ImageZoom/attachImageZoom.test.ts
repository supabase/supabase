import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { attachImageZoom } from './attachImageZoom'

const createImage = ({
  width = 200,
  height = 100,
  naturalWidth = 1000,
}: { width?: number; height?: number; naturalWidth?: number } = {}) => {
  const image = document.createElement('img')
  image.alt = 'Diagram'
  Object.defineProperty(image, 'naturalWidth', { value: naturalWidth })
  image.getBoundingClientRect = () => new DOMRect(100, 100, width, height)
  return image
}

const getClone = () => document.body.querySelector('img[aria-hidden="true"]')

let detach: () => void

const setup = (image: HTMLImageElement, { container = 'article', wrapper = '' } = {}) => {
  const root = document.createElement(container)
  if (wrapper) {
    const element = document.createElement(wrapper)
    element.append(image)
    root.append(element)
  } else {
    root.append(image)
  }
  document.body.append(root)
  detach = attachImageZoom()
  image.dispatchEvent(new Event('load'))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  detach()
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('attachImageZoom', () => {
  it('opens on click and closes on Escape', () => {
    const image = createImage()
    setup(image)
    expect(image).toHaveAttribute('role', 'button')
    expect(image).toHaveAttribute('aria-label', 'Zoom image: Diagram')

    image.click()
    expect(image).toHaveAttribute('aria-expanded', 'true')
    expect(image.style.opacity).toBe('0')
    expect(getClone()).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(image).toHaveAttribute('aria-expanded', 'false')
    vi.advanceTimersByTime(300)
    expect(getClone()).toBeNull()
    expect(image.style.opacity).toBe('')
  })

  it('opens with Enter and closes on overlay click', () => {
    const image = createImage()
    setup(image)

    image.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(image).toHaveAttribute('aria-expanded', 'true')

    const overlay = getClone()?.previousElementSibling
    expect(overlay).toBeInstanceOf(HTMLDivElement)
    if (overlay instanceof HTMLDivElement) overlay.click()
    expect(image).toHaveAttribute('aria-expanded', 'false')
  })

  it('shrinks back on scroll', () => {
    const image = createImage()
    setup(image)

    image.click()
    window.dispatchEvent(new Event('scroll'))
    expect(image).toHaveAttribute('aria-expanded', 'false')
    expect(getClone()).not.toBeNull()
    vi.advanceTimersByTime(300)
    expect(getClone()).toBeNull()
  })

  it('does nothing for an image with no size yet', () => {
    const image = createImage({ width: 0, height: 0 })
    setup(image)

    image.click()
    expect(getClone()).toBeNull()
  })

  it('skips images inside links', () => {
    const image = createImage()
    setup(image, { wrapper: 'a' })

    expect(image).not.toHaveAttribute('role')
    image.click()
    expect(getClone()).toBeNull()
  })

  it('skips images outside an article', () => {
    const image = createImage()
    setup(image, { container: 'nav' })

    expect(image).not.toHaveAttribute('role')
    image.click()
    expect(getClone()).toBeNull()
  })

  it('skips images already shown at full resolution', () => {
    const image = createImage({ naturalWidth: 150 })
    setup(image)

    expect(image).not.toHaveAttribute('role')
    image.click()
    expect(getClone()).toBeNull()
  })

  it('stops zooming after detach', () => {
    const image = createImage()
    setup(image)

    detach()
    image.click()
    expect(getClone()).toBeNull()
  })
})
