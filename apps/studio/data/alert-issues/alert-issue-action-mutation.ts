import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { alertIssueSchema, type AlertIssue } from './alert-issue.schema'
import type { AlertIssuesError } from './alert-issues-query'
import { alertIssuesKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'

export type AlertIssueAction = 'acknowledge' | 'snooze' | 'resolve' | 'reopen'

export type AlertIssueActionVariables = {
  projectRef: string
  alertIssueId: string
  action: AlertIssueAction
  until?: string
}

async function applyAlertIssueAction({
  projectRef,
  alertIssueId,
  action,
  until,
}: AlertIssueActionVariables): Promise<AlertIssue> {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchPost<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issues/${encodeURIComponent(alertIssueId)}/actions`,
    { action, ...(until && { until }) }
  )
  if (isStudioError(response)) throw response

  return alertIssueSchema.parse(response)
}

export const useAlertIssueActionMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AlertIssue, AlertIssuesError, AlertIssueActionVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applyAlertIssueAction,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: alertIssuesKeys.list(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update alert issue: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
