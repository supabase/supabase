import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { IssueUpdatePayload } from './issue-schema'
import { issuesKeys } from './keys'
import { updateIssue as updateMockIssue } from './mock/issues-mock-api'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type IssueUpdateVariables = {
  projectRef: string
  id: string
  payload: IssueUpdatePayload
}

// Mocked until the Issues API exists. The real call is `PATCH /v1/projects/{ref}/issues/{id}`.
async function updateIssue({ projectRef, id, payload }: IssueUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')
  return updateMockIssue({ projectRef, id, payload })
}

type IssueUpdateData = Awaited<ReturnType<typeof updateIssue>>

export const useIssueUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<IssueUpdateData, ResponseError, IssueUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IssueUpdateData, ResponseError, IssueUpdateVariables>({
    mutationFn: (vars) => updateIssue(vars),
    async onSuccess(data, variables, context) {
      // Status changes touch the list, the issue and its timeline
      await queryClient.invalidateQueries({ queryKey: issuesKeys.all(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update issue: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
