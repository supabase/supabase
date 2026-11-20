// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

// `helpers.ts` reads `window.matchMedia` when it is imported, so each test sets the environment up
// first and then imports a fresh copy of the module.
async function importHelpers() {
  vi.resetModules()
  return import('./helpers')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('importing helpers', () => {
  it('works where matchMedia is missing, as in jsdom', async () => {
    expect(window.matchMedia).toBeUndefined()
    await expect(importHelpers()).resolves.toMatchObject({ isBrowser: true })
  })

  // The chain that broke the www `sentry-browser` tests: consent-state -> posthog-client ->
  // telemetry-utils -> helpers.
  it('lets consent-state load where matchMedia is missing', async () => {
    expect(window.matchMedia).toBeUndefined()
    vi.resetModules()
    await expect(import('./consent-state')).resolves.toHaveProperty('hasConsented')
  })

  it('reads the reduced-motion preference where matchMedia exists', async () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    vi.stubGlobal('matchMedia', matchMedia)

    await importHelpers()

    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })
})
