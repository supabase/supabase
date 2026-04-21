import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useDataApiRevokeOnCreateDefaultEnabled,
  useTrackDefaultPrivilegesExposure,
} from '../useDataApiRevokeOnCreateDefault'
import { usePHFlag } from '@/hooks/ui/useFlag'
import * as constants from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

vi.mock('@/hooks/ui/useFlag', () => ({
  usePHFlag: vi.fn(),
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<typeof import('@/lib/constants')>('@/lib/constants')
  return {
    ...actual,
    IS_TEST_ENV: false,
  }
})

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: vi.fn(),
}))

describe('useDataApiRevokeOnCreateDefaultEnabled', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.mocked(constants, { partial: true }).IS_TEST_ENV = false
  })

  it('returns false when the PostHog flag is undefined (not yet resolved)', () => {
    vi.mocked(usePHFlag).mockReturnValue(undefined)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
  })

  it('returns false when the PostHog flag is false', () => {
    vi.mocked(usePHFlag).mockReturnValue(false)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
  })

  it('returns true when the PostHog flag is true', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(true)
  })

  it('returns false in test env regardless of flag value', () => {
    vi.mocked(constants, { partial: true }).IS_TEST_ENV = true
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
  })
})

describe('useTrackDefaultPrivilegesExposure', () => {
  const track = vi.fn()

  beforeEach(() => {
    vi.mocked(useTrack).mockReturnValue(track)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not fire while the flag is undefined', () => {
    vi.mocked(usePHFlag).mockReturnValue(undefined)
    renderHook(() => useTrackDefaultPrivilegesExposure({ surface: 'main', dataApiEnabled: true }))
    expect(track).not.toHaveBeenCalled()
  })

  it('fires once when the flag resolves to true on the main surface', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() => useTrackDefaultPrivilegesExposure({ surface: 'main', dataApiEnabled: true }))
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('project_creation_default_privileges_exposed', {
      surface: 'main',
      dataApiEnabled: true,
      dataApiRevokeOnCreateDefaultEnabled: true,
    })
  })

  it('fires once when the flag resolves to false on the main surface', () => {
    vi.mocked(usePHFlag).mockReturnValue(false)
    renderHook(() => useTrackDefaultPrivilegesExposure({ surface: 'main', dataApiEnabled: false }))
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('project_creation_default_privileges_exposed', {
      surface: 'main',
      dataApiEnabled: false,
      dataApiRevokeOnCreateDefaultEnabled: false,
    })
  })

  it('omits dataApiEnabled on the vercel surface', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() => useTrackDefaultPrivilegesExposure({ surface: 'vercel' }))
    expect(track).toHaveBeenCalledWith('project_creation_default_privileges_exposed', {
      surface: 'vercel',
      dataApiRevokeOnCreateDefaultEnabled: true,
    })
  })

  it('deduplicates across re-renders', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { rerender } = renderHook(() =>
      useTrackDefaultPrivilegesExposure({ surface: 'main', dataApiEnabled: true })
    )
    rerender()
    rerender()
    expect(track).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire if the flag flips after initial exposure', () => {
    vi.mocked(usePHFlag).mockReturnValue(false)
    const { rerender } = renderHook(() =>
      useTrackDefaultPrivilegesExposure({ surface: 'main', dataApiEnabled: true })
    )
    vi.mocked(usePHFlag).mockReturnValue(true)
    rerender()
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      expect.objectContaining({ dataApiRevokeOnCreateDefaultEnabled: false })
    )
  })
})
