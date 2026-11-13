import { renderHook } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useConsentToast } from './consent'

const consent = vi.hoisted(() => ({
  showConsentToast: true,
  hasConsented: false,
  acceptAll: vi.fn(),
  denyAll: vi.fn(),
}))
const toast = vi.hoisted(() => Object.assign(vi.fn(), { dismiss: vi.fn() }))

vi.mock('common/consent-state', () => ({ consentState: consent }))
vi.mock('valtio', () => ({ useSnapshot: () => consent }))
vi.mock('sonner', () => ({ toast }))
vi.mock('./ConsentToast', () => ({ ConsentToast: () => null }))

const shownToast = () =>
  toast.mock.calls[0][0] as ReactElement<{ onAccept: () => void; onOptOut: () => void }>

describe('useConsentToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opts out with a reload from the toast', () => {
    renderHook(() => useConsentToast())

    shownToast().props.onOptOut()

    expect(consent.denyAll).toHaveBeenCalledExactlyOnceWith({ reload: true })
  })

  it('accepts from the toast', () => {
    renderHook(() => useConsentToast())

    shownToast().props.onAccept()

    expect(consent.acceptAll).toHaveBeenCalledOnce()
  })
})
