import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { networkRestrictionKeys } from './keys'

export type NetworkRestrictionsApplyVariables = {
  projectRef: string
  id: string
  updatedParam: string
}

export async function applyNetworkRestrictions({
  projectRef,
  updatedParam,
}: NetworkRestrictionsApplyVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await patch(
    `${API_ADMIN_URL}/projects/${projectRef}/network-restrictions/apply`,
    { updated_param: updatedParam }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type NetworkRestrictionsApplyData = Awaited<ReturnType<typeof applyNetworkRestrictions>>

export const useNetworkRestrictionsApplyMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<NetworkRestrictionsApplyData, unknown, NetworkRestrictionsApplyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<NetworkRestrictionsApplyData, unknown, NetworkRestrictionsApplyVariables>(
    (vars) => applyNetworkRestrictions(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(networkRestrictionKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
