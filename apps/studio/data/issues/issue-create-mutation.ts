import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { issuesKeys } from './keys'
import { createIssue as createMockIssue, type IssueCreatePayload } from './mock/issues-mock-api'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type IssueCreateVariables = {
  projectRef: string
  payload: IssueCreatePayload
}

// Mocked until the Issues API exists. The real call is `POST /v1/projects/{ref}/issues`.
async function createIssue({ projectRef, payload }: IssueCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return createMockIssue({ projectRef, payload })
}

type IssueCreateData = Awaited<ReturnType<typeof createIssue>>

export const useIssueCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<IssueCreateData, ResponseError, IssueCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IssueCreateData, ResponseError, IssueCreateVariables>({
    mutationFn: (vars) => createIssue(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: issuesKeys.all(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to create issue: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
