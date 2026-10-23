import { queryOptions } from '@tanstack/react-query'

import { issuesKeys } from './keys'
import { listIssueTimeline } from './mock/issues-mock-api'
import type { ResponseError } from '@/types'

export type IssueTimelineVariables = { projectRef?: string; id?: string }
export type IssueTimelineError = ResponseError

// Mocked until the Issues API exists. The real call is
// `GET /v1/projects/{ref}/issues/{id}/timeline`.
async function getIssueTimeline({ projectRef, id }: IssueTimelineVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')
  return listIssueTimeline({ projectRef, id })
}

export type IssueTimelineData = Awaited<ReturnType<typeof getIssueTimeline>>

export const issueTimelineQueryOptions = ({ projectRef, id }: IssueTimelineVariables) =>
  queryOptions<IssueTimelineData, IssueTimelineError>({
    queryKey: issuesKeys.timeline(projectRef, id),
    queryFn: () => getIssueTimeline({ projectRef, id }),
    enabled: typeof projectRef !== 'undefined' && typeof id !== 'undefined',
  })
