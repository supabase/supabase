import { useEffect, useRef } from 'react'

import { usePHFlag } from '../ui/useFlag'
import { IS_TEST_ENV } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Controls the default state of the "Automatically expose new tables and functions"
 * checkbox at project creation. When the flag is on, the checkbox defaults
 * to unchecked (i.e. revoke SQL runs). When off/absent, the checkbox defaults
 * to checked (current behaviour — default grants remain).
 */
export const useDataApiRevokeOnCreateDefaultEnabled = (): boolean => {
  const flag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')

  // Preserve current behaviour (default grants remain) in tests so existing
  // E2E flows don't change silently. Tests that need the revoke-default path
  // should opt in explicitly.
  if (IS_TEST_ENV) {
    return false
  }

  return !!flag
}

type DefaultPrivilegesExposureOptions =
  | { surface: 'main'; dataApiEnabled: boolean }
  | { surface: 'vercel' }

/**
 * Fires `project_creation_default_privileges_exposed` once per mount after the
 * `dataApiRevokeOnCreateDefault` flag resolves. Gating on flag resolution keeps
 * cohort attribution clean — users whose flag never resolves are not counted in
 * either cohort. Deduplicated via ref so re-renders and mid-session flag flips
 * don't re-fire.
 */
export const useTrackDefaultPrivilegesExposure = (options: DefaultPrivilegesExposureOptions) => {
  const track = useTrack()
  const flag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')
  const hasTracked = useRef(false)

  const { surface } = options
  const dataApiEnabled = options.surface === 'main' ? options.dataApiEnabled : null

  useEffect(() => {
    if (hasTracked.current) return
    if (flag === undefined) return
    hasTracked.current = true
    track('project_creation_default_privileges_exposed', {
      surface,
      ...(dataApiEnabled !== null && { dataApiEnabled }),
      dataApiRevokeOnCreateDefaultEnabled: flag,
    })
  }, [flag, track, surface, dataApiEnabled])
}
