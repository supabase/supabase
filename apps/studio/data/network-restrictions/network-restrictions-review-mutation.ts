import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { networkRestrictionKeys } from './keys'
import { configKeys } from '@/data/config/keys'
import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'
import type { UseCustomMutationOptions } from '@/types'

export type NetworkRestrictionsReviewVariables = {
  projectRef: string
  grant: GrantFor<'post', '/v1/projects/{ref}/network-restrictions/review'>
  action: 'apply' | 'reject'
  // The pending_requested_at of the change on screen: the API only resolves that change
  requestedAt: string
}

async function reviewNetworkRestrictions({
  projectRef,
  grant,
  action,
  requestedAt,
}: NetworkRestrictionsReviewVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/v1/projects/{ref}/network-restrictions/review', {
    params: { path: { ref: projectRef } },
    body: { action, requested_at: requestedAt },
    grant,
  })

  if (error) handleError(error)
  return data
}

type NetworkRestrictionsReviewData = Awaited<ReturnType<typeof reviewNetworkRestrictions>>

export const useNetworkRestrictionsReviewMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    NetworkRestrictionsReviewData,
    StudioError,
    NetworkRestrictionsReviewVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    NetworkRestrictionsReviewData,
    StudioError,
    NetworkRestrictionsReviewVariables
  >({
    mutationFn: (vars) => reviewNetworkRestrictions(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: networkRestrictionKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: configKeys.projectConfig(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      // A 409 means the change on screen was already resolved or replaced, so show the current state
      if (error.code === 409) {
        await queryClient.invalidateQueries({
          queryKey: networkRestrictionKeys.list(variables.projectRef),
        })
      }
      if (onError === undefined) {
        const verb = variables.action === 'apply' ? 'apply' : 'discard'
        toast.error(`Failed to ${verb} network restrictions change: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
