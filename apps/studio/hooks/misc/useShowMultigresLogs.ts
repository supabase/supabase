import { useFlag } from 'common'

import { useIsHighAvailability } from './useSelectedProject'

/**
 * Whether to surface the Multigres logs collection (sidebar, page, and Field
 * Reference source).
 *
 * Gated on both:
 * - the `multigresLogs` feature flag, so rollout is decoupled from HA status
 *   and the feature ships dark until explicitly enabled, and
 * - the project's `high_availability` flag, since Multigres only runs on HA
 *   projects.
 *
 * Note: `high_availability` is an existing product feature that predates
 * Multigres, so the flag is required to avoid showing a broken collection to
 * existing HA projects that don't have a `multigres_logs` table.
 */
export const useShowMultigresLogs = () => {
  const multigresLogsEnabled = useFlag('multigresLogs')
  const isHighAvailability = useIsHighAvailability()

  return multigresLogsEnabled && isHighAvailability
}
