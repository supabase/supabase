import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { IssueDocument } from './issue-schema'
import { issuesKeys } from './keys'
import { createIssueComment as createMockIssueComment } from './mock/issues-mock-api'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type IssueCommentCreateVariables = {
  projectRef: string
  id: string
  body: IssueDocument
}

// Mocked until the Issues API exists. The real call is
// `POST /v1/projects/{ref}/issues/{id}/comments`.
async function createIssueComment({ projectRef, id, body }: IssueCommentCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')
  return createMockIssueComment({ projectRef, id, body })
}

type IssueCommentCreateData = Awaited<ReturnType<typeof createIssueComment>>

export const useIssueCommentCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<IssueCommentCreateData, ResponseError, IssueCommentCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IssueCommentCreateData, ResponseError, IssueCommentCreateVariables>({
    mutationFn: (vars) => createIssueComment(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: issuesKeys.all(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to add comment: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
