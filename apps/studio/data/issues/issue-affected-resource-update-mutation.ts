import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { IssueAffectedResourceUpdatePayload } from './issue-schema'
import { issuesKeys } from './keys'
import { updateAffectedResource as updateMockAffectedResource } from './mock/issues-mock-api'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type IssueAffectedResourceUpdateVariables = {
  projectRef: string
  id: string
  affectedId: string
  payload: IssueAffectedResourceUpdatePayload
}

// Mocked until the Issues API exists. The real call is
// `PATCH /v1/projects/{ref}/issues/{id}/affected/{affected_id}`.
async function updateAffectedResource({
  projectRef,
  id,
  affectedId,
  payload,
}: IssueAffectedResourceUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')
  if (!affectedId) throw new Error('affectedId is required')
  return updateMockAffectedResource({ projectRef, id, affectedId, payload })
}

type IssueAffectedResourceUpdateData = Awaited<ReturnType<typeof updateAffectedResource>>

export const useIssueAffectedResourceUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IssueAffectedResourceUpdateData,
    ResponseError,
    IssueAffectedResourceUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IssueAffectedResourceUpdateData,
    ResponseError,
    IssueAffectedResourceUpdateVariables
  >({
    mutationFn: (vars) => updateAffectedResource(vars),
    async onSuccess(data, variables, context) {
      // Muting can change the issue's severity, so the list, the issue and its timeline
      await queryClient.invalidateQueries({ queryKey: issuesKeys.all(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update resource: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
