import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { components } from 'api-types'
import { configKeys } from './keys'

type UpdateGP3Body = components['schemas']['DiskRequestAttributesGP3']
type UpdateIO2Body = components['schemas']['DiskRequestAttributesIO2']

export const COOLDOWN_DURATION = 60 * 60 * 6

export type UpdateDiskAttributesVariables = {
  ref?: string
  storageType: 'gp3' | 'io2'
  provisionedIOPS: number
  throughput?: number
  totalSize: number
}

// [Joshen] Need to fix this
export async function updateDiskAttributes({
  ref,
  storageType,
  provisionedIOPS,
  throughput,
  totalSize,
}: UpdateDiskAttributesVariables) {
  if (!ref) throw new Error('ref is required')

  const attributes =
    storageType === 'gp3'
      ? ({
          iops: provisionedIOPS,
          throughput_mbps: throughput,
          size_gb: totalSize,
          type: storageType,
        } as UpdateGP3Body)
      : ({
          iops: provisionedIOPS,
          size_gb: totalSize,
          type: storageType,
        } as UpdateIO2Body)

  const { data, error } = await post('/platform/projects/{ref}/disk', {
    params: { path: { ref } },
    body: { attributes },
  })
  if (error) handleError(error)
  return data
}

type UpdateDiskAttributesData = Awaited<ReturnType<typeof updateDiskAttributes>>

export const useUpdateDiskAttributesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateDiskAttributesData, ResponseError, UpdateDiskAttributesVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateDiskAttributesData, ResponseError, UpdateDiskAttributesVariables>(
    (vars) => updateDiskAttributes(vars),
    {
      async onSuccess(data, variables, context) {
        const { ref } = variables
        await queryClient.invalidateQueries(configKeys.diskAttributes(ref))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update disk attributes: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
