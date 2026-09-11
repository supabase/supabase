import { expect } from 'vitest'

function isAriaDisabled(element: Element) {
  if (!(element instanceof HTMLElement)) return false

  return element.getAttribute('aria-disabled') === 'true'
}

expect.extend({
  toBeAriaDisabled(received: Element) {
    const pass = isAriaDisabled(received)

    return {
      pass,
      message: () =>
        pass ? `expected element not to be aria-disabled` : `expected element to be aria-disabled`,
    }
  },
})

declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toBeAriaDisabled(): R
  }
}
