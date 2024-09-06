import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type UpdateDiskAttributesVariables = {
  ref: string
  type: string
  iops: number
  size_gb: number
  throughput_mbps?: number
}

// [Joshen] Need to fix this
export async function updateDiskAttributes({ ref }: UpdateDiskAttributesVariables) {
  const { data, error } = await post('/platform/projects/{ref}/disk', {
    params: { path: { ref }, body: {} },
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
