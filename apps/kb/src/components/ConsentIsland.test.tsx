// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

describe('ConsentIsland', () => {
  let root: Root | undefined

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    )
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
  })

  it('shows the consent toast when consent is needed', async () => {
    const { ConsentIsland } = await import('./ConsentIsland')
    const { consentState } = await import('common/consent-state')

    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<ConsentIsland />))

    await act(async () => {
      consentState.showConsentToast = true
    })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Accept')
      expect(document.body.textContent).toContain('Opt out')
    })
  })
})
