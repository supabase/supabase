import { queryOptions } from '@tanstack/react-query'

import { issuesKeys } from './keys'
import { listIssueNotificationRules } from './mock/issues-mock-api'
import type { ResponseError } from '@/types'

export type IssueNotificationRulesVariables = { projectRef?: string }
export type IssueNotificationRulesError = ResponseError

async function getIssueNotificationRules({ projectRef }: IssueNotificationRulesVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return listIssueNotificationRules({ projectRef })
}

export type IssueNotificationRulesData = Awaited<ReturnType<typeof getIssueNotificationRules>>

export const issueNotificationRulesQueryOptions = ({
  projectRef,
}: IssueNotificationRulesVariables) =>
  queryOptions<IssueNotificationRulesData, IssueNotificationRulesError>({
    queryKey: issuesKeys.notificationRules(projectRef),
    queryFn: () => getIssueNotificationRules({ projectRef }),
    enabled: typeof projectRef !== 'undefined',
  })
