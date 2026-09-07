import { expect } from 'vitest'

function isElementDisabled(element: Element) {
  if (!(element instanceof HTMLElement)) return false

  if ('disabled' in element && (element as HTMLButtonElement).disabled) return true

  return element.getAttribute('aria-disabled') === 'true'
}

expect.extend({
  toBeDisabled(received: Element) {
    const pass = isElementDisabled(received)

    return {
      pass,
      message: () =>
        pass ? `expected element not to be disabled` : `expected element to be disabled`,
    }
  },
  toBeEnabled(received: Element) {
    const pass = !isElementDisabled(received)

    return {
      pass,
      message: () =>
        pass ? `expected element to be disabled` : `expected element not to be disabled`,
    }
  },
})
