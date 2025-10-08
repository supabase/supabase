import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { networkRestrictionKeys } from './keys'

export type NetworkRestrictionsApplyVariables = {
  projectRef: string
  dbAllowedCidrs: string[]
  dbAllowedCidrsV6: string[]
}

export async function applyNetworkRestrictions({
  projectRef,
  dbAllowedCidrs,
  dbAllowedCidrsV6,
}: NetworkRestrictionsApplyVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/v1/projects/{ref}/network-restrictions/apply', {
    params: { path: { ref: projectRef } },
    body: { dbAllowedCidrs, dbAllowedCidrsV6 },
  })

  if (error) handleError(error)
  return data
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
