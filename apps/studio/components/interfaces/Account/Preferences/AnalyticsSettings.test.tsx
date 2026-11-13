import { fireEvent, screen, waitFor } from '@testing-library/react'
import { consentState } from 'common'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { AnalyticsSettings } from './AnalyticsSettings'
import { customRender } from '@/tests/lib/custom-render'

// Stands in for the Usercentrics SDK; consentState and useConsentState stay real
const makeUC = () => ({
  acceptAllServices: vi.fn(() => Promise.resolve()),
  denyAllServices: vi.fn(() => Promise.resolve()),
  getCategoriesBaseInfo: vi.fn(() => []),
})

describe('AnalyticsSettings', () => {
  const reload = vi.fn()
  const originalLocation = window.location
  let UC: ReturnType<typeof makeUC>

  beforeEach(() => {
    vi.clearAllMocks()
    UC = makeUC()
    consentState.UC = UC as never
    consentState.categories = []
    consentState.hasConsented = true
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    consentState.UC = null
    consentState.categories = null
    consentState.hasConsented = false
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  test('reloads once the opt-out is saved', async () => {
    const saved = Promise.withResolvers<void>()
    UC.denyAllServices.mockReturnValueOnce(saved.promise)
    customRender(<AnalyticsSettings />)

    fireEvent.click(screen.getByRole('switch'))

    expect(UC.denyAllServices).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()

    saved.resolve()
    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
  })

  test('does not reload when the opt-out fails to save', async () => {
    UC.denyAllServices.mockRejectedValueOnce(new Error('network'))
    customRender(<AnalyticsSettings />)

    fireEvent.click(screen.getByRole('switch'))

    await waitFor(() => expect(UC.denyAllServices).toHaveBeenCalledOnce())
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(reload).not.toHaveBeenCalled()
  })

  test('does not reload when opting in', async () => {
    consentState.hasConsented = false
    customRender(<AnalyticsSettings />)

    fireEvent.click(screen.getByRole('switch'))

    await waitFor(() => expect(consentState.hasConsented).toBe(true))
    expect(UC.acceptAllServices).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()
  })
})
