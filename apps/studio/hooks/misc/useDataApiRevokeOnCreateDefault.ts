import { useEffect, useRef } from 'react'

import { usePHFlag } from '../ui/useFlag'
import { IS_TEST_ENV } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Controls the default state of the "Automatically expose new tables"
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
  | { surface: 'main'; dataApiDefaultPrivileges: boolean }
  | { surface: 'vercel'; orgSlug: string | undefined }

/**
 * Fires `project_creation_default_privileges_exposed` once per mount, once
 * the flag has resolved. On the main surface, the event payload includes
 * `dataApiDefaultPrivileges` — the actual form-field value the experiment
 * controls (true = legacy grants kept, false = revoked on create).
 * Deduplicated via ref so re-renders and mid-session flag flips don't re-fire.
 */
export const useTrackDefaultPrivilegesExposure = (options: DefaultPrivilegesExposureOptions) => {
  const track = useTrack()
  const flag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')
  const hasTracked = useRef(false)

  const { surface } = options
  const dataApiDefaultPrivileges =
    options.surface === 'main' ? options.dataApiDefaultPrivileges : null
  const orgSlug = options.surface === 'vercel' ? options.orgSlug : undefined

  useEffect(() => {
    if (hasTracked.current) return
    if (flag === undefined) return
    if (surface === 'vercel' && !orgSlug) return
    hasTracked.current = true
    track(
      'project_creation_default_privileges_exposed',
      {
        surface,
        ...(dataApiDefaultPrivileges !== null && { dataApiDefaultPrivileges }),
        dataApiRevokeOnCreateDefaultEnabled: flag,
      },
      surface === 'vercel' ? { organization: orgSlug } : undefined
    )
  }, [flag, track, surface, dataApiDefaultPrivileges, orgSlug])
}
