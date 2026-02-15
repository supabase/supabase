import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { configKeys } from './keys'

export const COOLDOWN_DURATION = 60 * 60 * 6

export type UpdateDiskAttributesVariables = {
  ref?: string
  storageType: 'gp3' | 'io2'
  provisionedIOPS: number
  throughput?: number // MB/s
  totalSize: number
}

// [Joshen] Need to fix this
export async function updateDiskAttributes(updates: UpdateDiskAttributesVariables) {
  if (!updates.ref) throw new Error('ref is required')

  // NOTE(kamil): This should be expressed in types as discriminated union, but it requires
  // reworking of a whole form that provides data to that mutation
  const attributes =
    updates.storageType === 'gp3'
      ? {
          iops: updates.provisionedIOPS,
          // API field name is throughput_mbps (legacy), but values are treated as MB/s in the platform API.
          // If the platform switches to MiB/s, convert here before sending.
          throughput_mbps: updates.throughput!,
          size_gb: updates.totalSize,
          type: updates.storageType,
        }
      : {
          iops: updates.provisionedIOPS,
          size_gb: updates.totalSize,
          type: updates.storageType,
        }

  const { data, error } = await post('/platform/projects/{ref}/disk', {
    params: { path: { ref: updates.ref } },
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
  UseCustomMutationOptions<UpdateDiskAttributesData, ResponseError, UpdateDiskAttributesVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateDiskAttributesData, ResponseError, UpdateDiskAttributesVariables>({
    mutationFn: (vars) => updateDiskAttributes(vars),
    async onSuccess(data, variables, context) {
      const { ref } = variables
      await queryClient.invalidateQueries({ queryKey: configKeys.diskAttributes(ref) })
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
  })
}
