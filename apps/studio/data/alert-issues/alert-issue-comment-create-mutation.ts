import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { AlertIssueCommentsData } from './alert-issue-comments-query'
import { alertIssueCommentSchema, type AlertIssueComment } from './alert-issue.schema'
import type { AlertIssuesError } from './alert-issues-query'
import { alertIssuesKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AlertIssueCommentCreateVariables = {
  projectRef: string
  alertIssueId: string
  body: string
  /** Posts the comment as the Supabase Assistant instead of the dashboard user. */
  asAssistant?: boolean
}

async function createAlertIssueComment({
  projectRef,
  alertIssueId,
  body,
  asAssistant = false,
}: AlertIssueCommentCreateVariables): Promise<AlertIssueComment> {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchPost<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issues/${encodeURIComponent(alertIssueId)}/comments`,
    asAssistant ? { body, as_assistant: true } : { body }
  )
  if (isStudioError(response)) throw response

  return alertIssueCommentSchema.parse(response)
}

export const useAlertIssueCommentCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AlertIssueComment, AlertIssuesError, AlertIssueCommentCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAlertIssueComment,
    async onSuccess(data, variables, context) {
      // Comments are written asynchronously, so append the returned one instead of refetching.
      queryClient.setQueryData<AlertIssueCommentsData>(
        alertIssuesKeys.comments(variables.projectRef, variables.alertIssueId),
        (comments) => [...(comments ?? []), data]
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to add comment: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
