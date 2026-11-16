import { useFlag } from 'common'
import { useEffect, useRef } from 'react'

import { IS_TEST_ENV } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Default value of the "Grant API access to new tables automatically" checkbox
 * at project creation, driven by the `defaultNotExposedNewTables` flag (the
 * return value is `!flag`). When the flag is on, the checkbox defaults to
 * unchecked (i.e. revoke SQL runs). When the flag is off, or not loaded yet
 * (`useFlag` returns false), it defaults to checked (current behaviour —
 * default grants remain). Always returns false in tests.
 */
export const useDataApiRevokeOnCreateDefaultEnabled = (): boolean => {
  const flag = useFlag('defaultNotExposedNewTables')

  // Preserve current behaviour (default grants remain) in tests so existing
  // E2E flows don't change silently. Tests that need the revoke-default path
  // should opt in explicitly.
  if (IS_TEST_ENV) {
    return false
  }

  return !flag
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
 * form value is consistent with the flag's expected default (`!flag`). The
 * convergence gate avoids a render-ordering race: caller-side
 * sync effects (in /new/[slug] and the Vercel deploy flow) update the form
 * value when the flag resolves late, but child effects fire before parent
 * effects in the same commit, so without the gate the exposure would capture
 * the stale pre-sync value. If the user has dirtied the field, fire
 * immediately with their explicit value. Deduplicated via ref.
 */
export const useTrackDefaultPrivilegesExposure = (options: DefaultPrivilegesExposureOptions) => {
  const track = useTrack()
  const flag = useFlag('defaultNotExposedNewTables')
  const hasTracked = useRef(false)

  const { surface, dataApiDefaultPrivileges, hasUserModified } = options
  const orgSlug = options.surface === 'vercel' ? options.orgSlug : undefined

  useEffect(() => {
    if (hasTracked.current) return
    if (surface === 'vercel' && !orgSlug) return

    // Gate on form-flag convergence unless the user explicitly dirtied the field.
    const expectedDefault = !flag
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
