import { queryOptions } from '@tanstack/react-query'

import type { IssueListFilters } from './issue-schema'
import { issuesKeys } from './keys'
import { listIssues } from './mock/issues-mock-api'
import type { ResponseError } from '@/types'

export type IssuesVariables = { projectRef?: string; filters: IssueListFilters }
export type IssuesError = ResponseError

// Mocked until the Issues API exists. The real call is `GET /v1/projects/{ref}/issues`.
async function getIssues({ projectRef, filters }: IssuesVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return listIssues({ projectRef, filters })
}

export type IssuesData = Awaited<ReturnType<typeof getIssues>>

export const issuesQueryOptions = ({ projectRef, filters }: IssuesVariables) =>
  queryOptions<IssuesData, IssuesError>({
    queryKey: issuesKeys.list(projectRef, filters),
    queryFn: () => getIssues({ projectRef, filters }),
    enabled: typeof projectRef !== 'undefined',
    placeholderData: (previous) => previous,
    // Keep polling while an agent is writing so its reply lands without a reload
    refetchInterval: (query) =>
      query.state.data?.issues.some((issue) => issue.agents_working.length > 0) ? 1500 : false,
  })
