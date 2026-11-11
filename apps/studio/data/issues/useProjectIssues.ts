import { useFlag } from 'common'

import { lintsToIssues, signalsToIssues, sortIssues } from './lint-to-issue'
import { useAdvisorSignals } from '@/components/ui/AdvisorPanel/useAdvisorSignals'
import { useProjectHealthLintsQuery } from '@/data/lint/health-lints-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'

type UseProjectIssuesOptions = {
  projectRef?: string
  enabled?: boolean
  includeHealth?: boolean
  runHealthChecks?: boolean
}
export function useProjectIssues({
  projectRef,
  enabled = true,
  includeHealth = true,
  runHealthChecks = true,
}: UseProjectIssuesOptions) {
  const isHealthAdvisorEnabled = useFlag('healthAdvisor')
  const canRunHealth = includeHealth && isHealthAdvisorEnabled

  const lintsQuery = useProjectLintsQuery({ projectRef }, { enabled })
  const healthQuery = useProjectHealthLintsQuery(
    { projectRef },
    { enabled: enabled && canRunHealth && runHealthChecks }
  )
  const signalsQuery = useAdvisorSignals({ projectRef, enabled })

  const issues = enabled
    ? sortIssues([
        ...lintsToIssues([
          ...(lintsQuery.data ?? []),
          ...(canRunHealth ? (healthQuery.data ?? []) : []),
        ]),
        ...signalsToIssues(signalsQuery.data),
      ])
    : []

  const refetch = () =>
    Promise.all([
      lintsQuery.refetch(),
      signalsQuery.refetch(),
      ...(canRunHealth && healthQuery.isEnabled ? [healthQuery.refetch()] : []),
    ])

  const error = lintsQuery.error ?? signalsQuery.error ?? (canRunHealth ? healthQuery.error : null)
  const isError = enabled && error !== null
  const isLoading =
    enabled &&
    (lintsQuery.isLoading || signalsQuery.isLoading || (canRunHealth && healthQuery.isLoading))
  const isSuccess =
    enabled &&
    !isError &&
    lintsQuery.isSuccess &&
    signalsQuery.isSuccess &&
    (!canRunHealth || !healthQuery.isEnabled || healthQuery.isSuccess)

  return {
    issues,
    error: enabled ? error : null,
    isLoading,
    isError,
    isSuccess,
    isHealthLoading: canRunHealth && healthQuery.isLoading,
    isFetching:
      enabled &&
      (lintsQuery.isFetching ||
        signalsQuery.isFetching ||
        (canRunHealth && healthQuery.isFetching)),
    refetch,
  }
}
