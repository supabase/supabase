import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { networkRestrictionKeys } from './keys'

export type NetworkRestrictionsApplyVariables = {
  projectRef: string
  dbAllowedCidrs: string[]
}

export async function applyNetworkRestrictions({
  projectRef,
  dbAllowedCidrs,
}: NetworkRestrictionsApplyVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/network-restrictions/apply`,
    { dbAllowedCidrs }
  )
  if (response.error) throw response.error

  return response
}

type NetworkRestrictionsApplyData = Awaited<ReturnType<typeof applyNetworkRestrictions>>

export const useNetworkRestrictionsApplyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    NetworkRestrictionsApplyData,
    ResponseError,
    NetworkRestrictionsApplyVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    NetworkRestrictionsApplyData,
    ResponseError,
    NetworkRestrictionsApplyVariables
  >((vars) => applyNetworkRestrictions(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(networkRestrictionKeys.list(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to apply network restrictions: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
