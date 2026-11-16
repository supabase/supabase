import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { alertIssueTypeSchema, type AlertIssueType } from './alert-issue.schema'
import type { AlertIssuesError } from './alert-issues-query'
import { alertIssuesKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AlertIssueTypeCreateVariables = {
  projectRef: string
  name: string
  lql: string
  severity: string
  category: string
  description?: string
  group_by: string[]
}

async function createAlertIssueType({
  projectRef,
  ...rule
}: AlertIssueTypeCreateVariables): Promise<AlertIssueType> {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchPost<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issue-types`,
    rule
  )
  if (isStudioError(response)) throw response

  return alertIssueTypeSchema.parse(response)
}

export const useAlertIssueTypeCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AlertIssueType, AlertIssuesError, AlertIssueTypeCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAlertIssueType,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: alertIssuesKeys.types(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to create log rule: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
