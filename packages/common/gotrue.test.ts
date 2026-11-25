// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'

it('creates the auth client when the browser blocks site storage', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {} }))
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Access is denied for this document.', 'SecurityError')
    },
  })

  await expect(import('./gotrue')).resolves.toMatchObject({ gotrueClient: expect.any(Object) })
})
