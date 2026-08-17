import { afterEach, describe, expect, it, vi } from 'vitest'

import { scrollElementIntoContainer } from './scrollElementIntoContainer'

const mockRect = (top: number): DOMRect =>
  ({
    top,
    bottom: top + 40,
    left: 0,
    right: 0,
    width: 0,
    height: 40,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect

describe('scrollElementIntoContainer', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('scrolls the overflow container by the element offset minus the top margin', () => {
    const container = document.createElement('div')
    const element = document.createElement('div')
    container.append(element)
    document.body.append(container)

    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 50 })
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect(100))
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(mockRect(500))
    const scrollTo = vi.fn()
    container.scrollTo = scrollTo

    scrollElementIntoContainer(element, container, { offset: 96, behavior: 'auto' })

    expect(scrollTo).toHaveBeenCalledWith({ top: 354, behavior: 'auto' })
  })

  it('falls back to scrollIntoView when there is no overflow container', () => {
    const element = document.createElement('div')
    const scrollIntoView = vi.fn()
    element.scrollIntoView = scrollIntoView

    scrollElementIntoContainer(element, null, { behavior: 'auto' })

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })
})
