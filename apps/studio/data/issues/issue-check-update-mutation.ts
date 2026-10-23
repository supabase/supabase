import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { IssueChecksData } from './issue-checks-query'
import { issuesKeys } from './keys'
import { updateIssueCheck as updateMockIssueCheck } from './mock/issues-mock-api'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type IssueCheckUpdateVariables = {
  projectRef: string
  checkId: string
  isEnabled: boolean
}

async function updateIssueCheck(variables: IssueCheckUpdateVariables) {
  if (!variables.projectRef) throw new Error('projectRef is required')
  if (!variables.checkId) throw new Error('checkId is required')
  return updateMockIssueCheck(variables)
}

type IssueCheckUpdateData = Awaited<ReturnType<typeof updateIssueCheck>>

export const useIssueCheckUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<IssueCheckUpdateData, ResponseError, IssueCheckUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<IssueCheckUpdateData, ResponseError, IssueCheckUpdateVariables>({
    mutationFn: updateIssueCheck,
    async onSuccess(data, variables, context) {
      queryClient.setQueryData<IssueChecksData>(issuesKeys.checks(variables.projectRef), (checks) =>
        checks?.map((check) => (check.id === data.id ? { ...check, ...data } : check))
      )
      await queryClient.invalidateQueries({ queryKey: issuesKeys.checks(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update check: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
