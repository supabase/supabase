import { useParams } from 'common'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'

export function useQueryInsightsResourceStatus() {
  const { ref } = useParams()

  const { data: warnings } = useResourceWarningsQuery({ ref }, { staleTime: 1000 * 60 * 5 })

  const warning = Array.isArray(warnings) ? warnings.find((w) => w.project === ref) : warnings

  const hasComputeWarnings =
    !!warning?.cpu_exhaustion ||
    !!warning?.memory_and_swap_exhaustion ||
    !!warning?.disk_io_exhaustion

  const isCritical =
    warning?.cpu_exhaustion === 'critical' ||
    warning?.memory_and_swap_exhaustion === 'critical' ||
    warning?.disk_io_exhaustion === 'critical'

  return { hasComputeWarnings, isCritical }
}
