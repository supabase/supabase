import { posthogClient } from 'common'
import { useEffect, useRef, useState } from 'react'

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
  | { surface: 'main'; dataApiEnabled: boolean }
  | { surface: 'vercel' }

/**
 * Fires `project_creation_default_privileges_exposed` once per mount after both
 * the `dataApiRevokeOnCreateDefault` flag resolves AND the `org_count` person
 * property has been set on the PostHog SDK. Waiting for both signals avoids
 * locking in the variant on the initial /flags/ response, which races the
 * org_count identify for brand-new signups — the exposure must reflect the
 * targeting-aware flag value. Deduplicated via ref so re-renders and mid-session
 * flag flips don't re-fire.
 */
export const useTrackDefaultPrivilegesExposure = (options: DefaultPrivilegesExposureOptions) => {
  const track = useTrack()
  const flag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')
  const hasTracked = useRef(false)
  const [orgCountReady, setOrgCountReady] = useState(
    () => posthogClient.getPersonProperty('org_count') !== undefined
  )

  const { surface } = options
  const dataApiEnabled = options.surface === 'main' ? options.dataApiEnabled : null

  // Mark ready once org_count appears on the SDK person. A /flags/ response
  // received after our identify will have included org_count in the evaluation,
  // so subscribing via onFeatureFlags is the right signal that the flag store
  // reflects the targeting-aware value.
  useEffect(() => {
    if (orgCountReady) return
    const check = () => {
      if (posthogClient.getPersonProperty('org_count') !== undefined) {
        setOrgCountReady(true)
      }
    }
    check()
    return posthogClient.onFeatureFlags(check)
  }, [orgCountReady])

  useEffect(() => {
    if (hasTracked.current) return
    if (flag === undefined) return
    if (!orgCountReady) return
    hasTracked.current = true
    track('project_creation_default_privileges_exposed', {
      surface,
      ...(dataApiEnabled !== null && { dataApiEnabled }),
      dataApiRevokeOnCreateDefaultEnabled: flag,
    })
  }, [flag, orgCountReady, track, surface, dataApiEnabled])
}
