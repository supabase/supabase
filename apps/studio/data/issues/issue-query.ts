import { queryOptions } from '@tanstack/react-query'

import { issuesKeys } from './keys'
import { getIssue as getMockIssue } from './mock/issues-mock-api'
import type { ResponseError } from '@/types'

export type IssueVariables = { projectRef?: string; id?: string }
export type IssueError = ResponseError

// Mocked until the Issues API exists. The real call is `GET /v1/projects/{ref}/issues/{id}`.
async function getIssue({ projectRef, id }: IssueVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')
  return getMockIssue({ projectRef, id })
}

export type IssueData = Awaited<ReturnType<typeof getIssue>>

export const issueQueryOptions = ({ projectRef, id }: IssueVariables) =>
  queryOptions<IssueData, IssueError>({
    queryKey: issuesKeys.detail(projectRef, id),
    queryFn: () => getIssue({ projectRef, id }),
    enabled: typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    refetchInterval: (query) => ((query.state.data?.agents_working.length ?? 0) > 0 ? 1500 : false),
  })
