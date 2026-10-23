import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { IssueNotificationRuleInput } from './issue-notification-schema'
import { issuesKeys } from './keys'
import { deleteIssueNotificationRule, saveIssueNotificationRule } from './mock/issues-mock-api'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type IssueNotificationRuleVariables = { projectRef: string } & (
  | { action: 'save'; id?: string; rule: IssueNotificationRuleInput }
  | { action: 'delete'; id: string }
)

async function mutateIssueNotificationRule(variables: IssueNotificationRuleVariables) {
  if (!variables.projectRef) throw new Error('projectRef is required')
  if (variables.action === 'delete') return deleteIssueNotificationRule(variables)
  return saveIssueNotificationRule(variables)
}

type IssueNotificationRuleData = Awaited<ReturnType<typeof mutateIssueNotificationRule>>

export const useIssueNotificationRuleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IssueNotificationRuleData,
    ResponseError,
    IssueNotificationRuleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<IssueNotificationRuleData, ResponseError, IssueNotificationRuleVariables>({
    mutationFn: mutateIssueNotificationRule,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: issuesKeys.notificationRules(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined)
        toast.error(`Failed to save notification settings: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
