import { useEffect, useRef } from 'react'

import { usePHFlag } from '@/hooks/ui/useFlag'
import { useTrack } from '@/lib/telemetry/track'

type Options =
  | { surface: 'main'; dataApiEnabled: boolean }
  | { surface: 'vercel' }

/**
 * Fires `project_creation_default_privileges_exposed` once per mount after the
 * `dataApiRevokeOnCreateDefault` flag resolves. Gating on flag resolution keeps
 * cohort attribution clean — users whose flag never resolves are not counted in
 * either cohort. Deduplicated via ref so re-renders and mid-session flag flips
 * don't re-fire.
 */
export const useTrackDefaultPrivilegesExposure = (options: Options) => {
  const track = useTrack()
  const flag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')
  const hasTracked = useRef(false)

  const { surface } = options
  const dataApiEnabled = options.surface === 'main' ? options.dataApiEnabled : undefined

  useEffect(() => {
    if (hasTracked.current) return
    if (flag === undefined) return
    hasTracked.current = true
    track('project_creation_default_privileges_exposed', {
      surface,
      ...(surface === 'main' && { dataApiEnabled: dataApiEnabled as boolean }),
      dataApiRevokeOnCreateDefaultEnabled: flag,
    })
  }, [flag, track, surface, dataApiEnabled])
}
