import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { AlertIssuesError } from './alert-issues-query'
import { alertIssuesKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AlertIssueTypeDeleteVariables = { projectRef: string; ruleKey: string }

async function deleteAlertIssueType({ projectRef, ruleKey }: AlertIssueTypeDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchPost<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issue-types/${encodeURIComponent(ruleKey)}`,
    {},
    { method: 'DELETE' }
  )
  if (isStudioError(response)) throw response

  return { ruleKey }
}

export const useAlertIssueTypeDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<{ ruleKey: string }, AlertIssuesError, AlertIssueTypeDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAlertIssueType,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: alertIssuesKeys.types(variables.projectRef) }),
        queryClient.invalidateQueries({ queryKey: alertIssuesKeys.list(variables.projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete log rule: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
