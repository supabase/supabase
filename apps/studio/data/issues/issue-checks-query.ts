import { queryOptions } from '@tanstack/react-query'

import { issuesKeys } from './keys'
import { listIssueChecks } from './mock/issues-mock-api'
import type { ResponseError } from '@/types'

export type IssueChecksVariables = { projectRef?: string }
export type IssueChecksError = ResponseError

// Uses the same project-local mock storage as issues until the Issues API exists.
async function getIssueChecks({ projectRef }: IssueChecksVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return listIssueChecks({ projectRef })
}

export type IssueChecksData = Awaited<ReturnType<typeof getIssueChecks>>

export const issueChecksQueryOptions = ({ projectRef }: IssueChecksVariables) =>
  queryOptions<IssueChecksData, IssueChecksError>({
    queryKey: issuesKeys.checks(projectRef),
    queryFn: () => getIssueChecks({ projectRef }),
    enabled: typeof projectRef !== 'undefined',
  })
