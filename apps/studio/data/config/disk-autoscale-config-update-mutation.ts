import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type UpdateDiskAutoscaleConfigVariables = {
  projectRef?: string
  growthPercent?: number | null
  maxSizeGb?: number | null
  minIncrementGb?: number | null
}

export async function updateDiskAutoscaleConfig({
  projectRef,
  growthPercent,
  maxSizeGb,
  minIncrementGb,
}: UpdateDiskAutoscaleConfigVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/projects/{ref}/disk/custom-config', {
    params: { path: { ref: projectRef } },
    body: {
      growth_percent: growthPercent,
      max_size_gb: maxSizeGb,
      min_increment_gb: minIncrementGb,
    },
  })
  if (error) handleError(error)
  return data
}

type UpdateDiskAutoscaleConfigData = Awaited<ReturnType<typeof updateDiskAutoscaleConfig>>

export const useUpdateDiskAutoscaleConfigMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    UpdateDiskAutoscaleConfigData,
    ResponseError,
    UpdateDiskAutoscaleConfigVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    UpdateDiskAutoscaleConfigData,
    ResponseError,
    UpdateDiskAutoscaleConfigVariables
  >((vars) => updateDiskAutoscaleConfig(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(configKeys.diskAutoscaleConfig(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update disk autoscale config: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
