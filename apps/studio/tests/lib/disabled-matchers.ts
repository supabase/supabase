import { expect } from 'vitest'

function isUnavailable(element: Element) {
  if (!(element instanceof HTMLElement)) return false

  return element.getAttribute('aria-disabled') === 'true'
}

expect.extend({
  toBeUnavailable(received: Element) {
    const pass = isUnavailable(received)

    return {
      pass,
      message: () =>
        pass ? `expected element not to be unavailable` : `expected element to be unavailable`,
    }
  },
})

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeUnavailable(): T
  }
  interface AsymmetricMatchersContaining {
    toBeUnavailable(): void
  }
}
