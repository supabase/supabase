import { useFlag } from 'common'

/**
 * Whether to surface the Multigres logs collection (legacy logs sidebar, page,
 * Field Reference source, and the unified logs filter). Gated on the
 * `showMultigresLogs` feature flag so rollout is controlled centrally.
 */
export const useShowMultigresLogs = () => {
  return useFlag('showMultigresLogs')
}
