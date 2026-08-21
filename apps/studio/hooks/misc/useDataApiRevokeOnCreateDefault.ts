import { useEffect, useRef } from 'react'

import { usePHFlag } from '../ui/useFlag'
import { IS_TEST_ENV } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Returns true iff the user is assigned to the treatment arm of the
 * dataApiRevokeOnCreateDefault experiment. Shape-agnostic across the current
 * boolean rollout config and a future multivariate experiment with named
 * variants. See GROWTH-877 for the migration plan.
 *
 * Accepts:
 *   - `true`     → treatment (current boolean shape)
 *   - `'test'`   → treatment (future multivariate shape)
 *   - anything else (`false`, `'control'`, `null`, `undefined`) → not treatment
 *
 * Use this everywhere the flag's value is read so the PostHog config can
 * migrate to multivariate without a coordinated frontend deploy.
 */
export const isInDataApiRevokeTreatment = (flag: boolean | string | undefined): boolean => {
  if (flag === true) return true
  if (flag === 'test') return true
  return false
}

/**
 * Controls the default state of the "Automatically expose new tables"
 * checkbox at project creation. When the flag is on, the checkbox defaults
 * to unchecked (i.e. revoke SQL runs). When off/absent, the checkbox defaults
 * to checked (current behaviour — default grants remain).
 */
export const useDataApiRevokeOnCreateDefaultEnabled = (): boolean => {
  const flag = usePHFlag<boolean | string>('dataApiRevokeOnCreateDefault')

  // Preserve current behaviour (default grants remain) in tests so existing
  // E2E flows don't change silently. Tests that need the revoke-default path
  // should opt in explicitly.
  if (IS_TEST_ENV) {
    return false
  }

  return isInDataApiRevokeTreatment(flag)
}

type DefaultPrivilegesExposureOptions =
  | {
      surface: 'main'
      dataApiDefaultPrivileges: boolean
      hasUserModified: boolean
    }
  | {
      surface: 'vercel'
      orgSlug: string | undefined
      dataApiDefaultPrivileges: boolean
      hasUserModified: boolean
    }

/**
 * Fires `project_creation_default_privileges_exposed` once per mount, once the
 * flag has resolved AND the form value is consistent with the flag's expected
 * default. The convergence gate avoids a render-ordering race: caller-side
 * sync effects (in /new/[slug] and the Vercel deploy flow) update the form
 * value when the flag resolves late, but child effects fire before parent
 * effects in the same commit, so without the gate the exposure would capture
 * the stale pre-sync value. If the user has dirtied the field, fire
 * immediately with their explicit value. Deduplicated via ref.
 */
export const useTrackDefaultPrivilegesExposure = (options: DefaultPrivilegesExposureOptions) => {
  const track = useTrack()
  const flag = usePHFlag<boolean | string>('dataApiRevokeOnCreateDefault')
  const hasTracked = useRef(false)

  const { surface, dataApiDefaultPrivileges, hasUserModified } = options
  const orgSlug = options.surface === 'vercel' ? options.orgSlug : undefined

  useEffect(() => {
    if (hasTracked.current) return
    if (flag === undefined) return
    if (surface === 'vercel' && !orgSlug) return
    // Gate on form-flag convergence unless the user explicitly dirtied the field.
    const expectedDefault = !isInDataApiRevokeTreatment(flag)
    if (!hasUserModified && dataApiDefaultPrivileges !== expectedDefault) return
    hasTracked.current = true
    track(
      'project_creation_default_privileges_exposed',
      {
        surface,
        dataApiDefaultPrivileges,
        dataApiRevokeOnCreateDefaultEnabled: flag,
      },
      surface === 'vercel' ? { organization: orgSlug } : undefined
    )
  }, [flag, track, surface, dataApiDefaultPrivileges, hasUserModified, orgSlug])
}
