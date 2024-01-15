import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { projectKeys } from './keys'

export type ProjectTransferVariables = {
  projectRef?: string
  targetOrganizationSlug?: string
}

type ProjectTransferError = {
  message: string
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

  const response = await post(`${API_URL}/projects/${projectRef}/transfer`, payload)
  if (response.error) throw response.error

  return response
}

type ProjectTransferData = Awaited<ReturnType<typeof transferProject>>

export const useProjectTransferMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectTransferData, ProjectTransferError, ProjectTransferVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectTransferData, ProjectTransferError, ProjectTransferVariables>(
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
