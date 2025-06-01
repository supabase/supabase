import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectTransferVariables = {
  projectRef?: string
  targetOrganizationSlug?: string
}

export async function transferProject({
  projectRef,
  targetOrganizationSlug,
}: ProjectTransferVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!targetOrganizationSlug) throw new Error('targetOrganizationSlug is required')

  const payload: { target_organization_slug: string } = {
    target_organization_slug: targetOrganizationSlug,
  }

  const { data, error } = await post('/platform/projects/{ref}/transfer', {
    params: { path: { ref: projectRef } },
    body: payload,
  })
  if (error) handleError(error)
  return data
}

type ProjectTransferData = Awaited<ReturnType<typeof transferProject>>

export const useProjectTransferMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectTransferData, ResponseError, ProjectTransferVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectTransferData, ResponseError, ProjectTransferVariables>(
    (vars) => transferProject(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, targetOrganizationSlug } = variables
        await Promise.all([
          queryClient.invalidateQueries(
            projectKeys.projectTransferPreview(projectRef, targetOrganizationSlug)
          ),
          queryClient.invalidateQueries(projectKeys.detail(projectRef)),
          queryClient.invalidateQueries(projectKeys.list()),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to transfer project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
