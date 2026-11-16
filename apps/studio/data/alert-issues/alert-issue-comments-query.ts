import { queryOptions } from '@tanstack/react-query'
import z from 'zod/v4'

import { alertIssueCommentSchema } from './alert-issue.schema'
import { alertIssuesKeys } from './keys'
import { fetchGet } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'

export type AlertIssueCommentsVariables = { projectRef?: string; alertIssueId?: string }

async function getAlertIssueComments(
  { projectRef, alertIssueId }: AlertIssueCommentsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!alertIssueId) throw new Error('alertIssueId is required')

  const response = await fetchGet<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issues/${encodeURIComponent(alertIssueId)}/comments`,
    { abortSignal: signal }
  )
  if (isStudioError(response)) throw response

  return z.array(alertIssueCommentSchema).parse(response)
}

export type AlertIssueCommentsData = Awaited<ReturnType<typeof getAlertIssueComments>>

export const alertIssueCommentsQueryOptions = ({
  projectRef,
  alertIssueId,
}: AlertIssueCommentsVariables) =>
  queryOptions({
    queryKey: alertIssuesKeys.comments(projectRef, alertIssueId),
    queryFn: ({ signal }) => getAlertIssueComments({ projectRef, alertIssueId }, signal),
    enabled: !IS_PLATFORM && !!projectRef && !!alertIssueId,
  })
