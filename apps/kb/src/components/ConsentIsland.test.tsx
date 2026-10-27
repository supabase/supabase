// @vitest-environment jsdom
import { consentState } from 'common/consent-state'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ConsentIsland } from './ConsentIsland'

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

describe('ConsentIsland', () => {
  let root: Root | undefined

  beforeAll(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-theme')
  })

  function render() {
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root!.render(<ConsentIsland />))
  }

  it('shows the consent toast when consent is needed', async () => {
    render()

    await act(async () => {
      consentState.showConsentToast = true
    })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Accept')
      expect(document.body.textContent).toContain('Opt out')
    })
  })

  it('matches the toaster theme to the page theme', async () => {
    document.documentElement.setAttribute('data-theme', 'light')
    render()

    await act(async () => {
      consentState.showConsentToast = true
    })

    await vi.waitFor(() => {
      expect(document.querySelector('[data-sonner-theme]')?.getAttribute('data-sonner-theme')).toBe(
        'light'
      )
    })
  })
})
