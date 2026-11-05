import { useFlag } from 'common'

import { lintsToIssues, signalsToIssues, sortIssues } from './lint-to-issue'
import { useAdvisorSignals } from '@/components/ui/AdvisorPanel/useAdvisorSignals'
import { useProjectHealthLintsQuery } from '@/data/lint/health-lints-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'

type UseProjectIssuesOptions = {
  projectRef?: string
  enabled?: boolean
  /** Health checks open a live database connection, so a surface can opt out of running them */
  includeHealth?: boolean
}

/**
 * The project's open issues, derived from the advisor checks that find them. There's no
 * Issues API yet: a check that stops failing simply stops returning an issue.
 */
export function useProjectIssues({
  projectRef,
  enabled = true,
  includeHealth = true,
}: UseProjectIssuesOptions) {
  const isHealthAdvisorEnabled = useFlag('healthAdvisor')
  const canRunHealth = includeHealth && isHealthAdvisorEnabled

  const lintsQuery = useProjectLintsQuery({ projectRef }, { enabled })
  const healthQuery = useProjectHealthLintsQuery(
    { projectRef },
    { enabled: enabled && canRunHealth }
  )
  const { data: signals } = useAdvisorSignals({ projectRef, enabled })

  const issues = sortIssues([
    ...lintsToIssues([
      ...(lintsQuery.data ?? []),
      ...(canRunHealth ? (healthQuery.data ?? []) : []),
    ]),
    ...signalsToIssues(signals),
  ])

  const refetch = () =>
    Promise.all([lintsQuery.refetch(), ...(canRunHealth ? [healthQuery.refetch()] : [])])

  return {
    issues,
    error: lintsQuery.error,
    isLoading: lintsQuery.isLoading,
    isError: lintsQuery.isError,
    isSuccess: lintsQuery.isSuccess,
    /** Health results arrive after the rest, so a health issue isn't missing until this settles */
    isHealthLoading: canRunHealth && healthQuery.isLoading,
    isFetching: lintsQuery.isFetching || (canRunHealth && healthQuery.isFetching),
    refetch,
  }
}
