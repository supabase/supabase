import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { AnalyticsSettings } from './AnalyticsSettings'
import { customRender } from '@/tests/lib/custom-render'

const consent = vi.hoisted(() => ({
  hasAccepted: true,
  categories: [],
  acceptAll: vi.fn(),
  denyAll: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useConsentState: () => consent,
}))

describe('AnalyticsSettings', () => {
  const reload = vi.fn()
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    consent.hasAccepted = true
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  test('reloads once the opt-out is saved', async () => {
    const saved = Promise.withResolvers<boolean>()
    consent.denyAll.mockReturnValueOnce(saved.promise)
    customRender(<AnalyticsSettings />)

    fireEvent.click(screen.getByRole('switch'))

    expect(consent.denyAll).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()

    saved.resolve(true)
    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
  })

  test('does not reload when the opt-out fails to save', async () => {
    consent.denyAll.mockResolvedValueOnce(false)
    customRender(<AnalyticsSettings />)

    fireEvent.click(screen.getByRole('switch'))

    await waitFor(() => expect(consent.denyAll).toHaveBeenCalledOnce())
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(reload).not.toHaveBeenCalled()
  })

  test('does not reload when opting in', () => {
    consent.hasAccepted = false
    customRender(<AnalyticsSettings />)

    fireEvent.click(screen.getByRole('switch'))

    expect(consent.acceptAll).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()
  })
})
