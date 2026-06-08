import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isInDataApiRevokeTreatment,
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

describe('isInDataApiRevokeTreatment', () => {
  it('returns true for boolean true (current rollout shape)', () => {
    expect(isInDataApiRevokeTreatment(true)).toBe(true)
  })

  it("returns true for the 'test' variant (future multivariate shape)", () => {
    expect(isInDataApiRevokeTreatment('test')).toBe(true)
  })

  it('returns false for boolean false', () => {
    expect(isInDataApiRevokeTreatment(false)).toBe(false)
  })

  it("returns false for the 'control' variant", () => {
    expect(isInDataApiRevokeTreatment('control')).toBe(false)
  })

  it('returns false for undefined (flag not resolved)', () => {
    expect(isInDataApiRevokeTreatment(undefined)).toBe(false)
  })

  it('returns false for unrelated string values', () => {
    expect(isInDataApiRevokeTreatment('something-else')).toBe(false)
    expect(isInDataApiRevokeTreatment('')).toBe(false)
  })
})

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

  it("returns true when the PostHog flag is the 'test' variant string", () => {
    vi.mocked(usePHFlag).mockReturnValue('test')
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(true)
  })

  it("returns false when the PostHog flag is the 'control' variant string", () => {
    vi.mocked(usePHFlag).mockReturnValue('control')
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
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
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: true,
        hasUserModified: false,
      })
    )
    expect(track).not.toHaveBeenCalled()
  })

  it('fires once when the flag resolves to true on the main surface', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: false,
        hasUserModified: false,
      })
    )
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      {
        surface: 'main',
        dataApiDefaultPrivileges: false,
        dataApiRevokeOnCreateDefaultEnabled: true,
      },
      undefined
    )
  })

  it('fires once when the flag resolves to false on the main surface', () => {
    vi.mocked(usePHFlag).mockReturnValue(false)
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: true,
        hasUserModified: false,
      })
    )
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      {
        surface: 'main',
        dataApiDefaultPrivileges: true,
        dataApiRevokeOnCreateDefaultEnabled: false,
      },
      undefined
    )
  })

  it('does not fire while the form value is stale relative to the flag (waits for sync)', () => {
    // Race: flag just resolved to true (treatment), but the caller-side sync
    // useEffect hasn't run yet, so the form value is still the legacy `true`.
    // Without the convergence gate, exposure would fire with the wrong value.
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: true,
        hasUserModified: false,
      })
    )
    expect(track).not.toHaveBeenCalled()
  })

  it('fires on the next render after the form syncs to match the flag', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { rerender } = renderHook(
      ({ dataApiDefaultPrivileges }: { dataApiDefaultPrivileges: boolean }) =>
        useTrackDefaultPrivilegesExposure({
          surface: 'main',
          dataApiDefaultPrivileges,
          hasUserModified: false,
        }),
      { initialProps: { dataApiDefaultPrivileges: true } }
    )
    expect(track).not.toHaveBeenCalled()

    // Caller-side sync runs and updates the form value to !flag.
    rerender({ dataApiDefaultPrivileges: false })
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      expect.objectContaining({
        dataApiDefaultPrivileges: false,
        dataApiRevokeOnCreateDefaultEnabled: true,
      }),
      undefined
    )
  })

  it('fires immediately with the dirty value when the user has modified the field', () => {
    // User toggled the checkbox before the flag resolved, dirtying the field.
    // The sync gate is bypassed; exposure fires with the user's explicit value.
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: true, // form value disagrees with !flag=false
        hasUserModified: true,
      })
    )
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      {
        surface: 'main',
        dataApiDefaultPrivileges: true,
        dataApiRevokeOnCreateDefaultEnabled: true,
      },
      undefined
    )
  })

  it('fires on the vercel surface with the form-flag convergence gate', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'vercel',
        orgSlug: 'acme-org',
        dataApiDefaultPrivileges: false,
        hasUserModified: false,
      })
    )
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      {
        surface: 'vercel',
        dataApiDefaultPrivileges: false,
        dataApiRevokeOnCreateDefaultEnabled: true,
      },
      { organization: 'acme-org' }
    )
  })

  it('skips emission on vercel surface when orgSlug is missing', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'vercel',
        orgSlug: undefined,
        dataApiDefaultPrivileges: false,
        hasUserModified: false,
      })
    )
    expect(track).not.toHaveBeenCalled()
  })

  it('deduplicates across re-renders', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { rerender } = renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: false,
        hasUserModified: false,
      })
    )
    rerender()
    rerender()
    expect(track).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire if the flag flips after initial exposure', () => {
    vi.mocked(usePHFlag).mockReturnValue(false)
    const { rerender } = renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: true,
        hasUserModified: false,
      })
    )
    vi.mocked(usePHFlag).mockReturnValue(true)
    rerender()
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      expect.objectContaining({ dataApiRevokeOnCreateDefaultEnabled: false }),
      undefined
    )
  })

  // The next two tests cover the future multivariate flag shape (GROWTH-877).
  // Today the flag returns boolean true/false; post-migration it returns the
  // variant string. The convergence gate must derive the expected default from
  // the variant, not from `!flag` directly — `!'control'` is false (truthy
  // string negation), which would have set the wrong expected default and
  // either skipped or mis-fired the exposure for control-arm users.

  it("fires for the 'test' variant with the correct convergence default (treatment)", () => {
    vi.mocked(usePHFlag).mockReturnValue('test')
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: false, // expected default for treatment
        hasUserModified: false,
      })
    )
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      {
        surface: 'main',
        dataApiDefaultPrivileges: false,
        dataApiRevokeOnCreateDefaultEnabled: 'test',
      },
      undefined
    )
  })

  it("fires for the 'control' variant with the correct convergence default (legacy)", () => {
    vi.mocked(usePHFlag).mockReturnValue('control')
    renderHook(() =>
      useTrackDefaultPrivilegesExposure({
        surface: 'main',
        dataApiDefaultPrivileges: true, // expected default for non-treatment
        hasUserModified: false,
      })
    )
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'project_creation_default_privileges_exposed',
      {
        surface: 'main',
        dataApiDefaultPrivileges: true,
        dataApiRevokeOnCreateDefaultEnabled: 'control',
      },
      undefined
    )
  })
})
