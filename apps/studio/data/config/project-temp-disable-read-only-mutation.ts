import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { usageKeys } from 'data/usage/keys'
import { ResponseError } from 'types'

export type TempDisableReadOnlyModeVariables = {
  projectRef: string
}

export async function tempDisableReadOnlyMode({ projectRef }: TempDisableReadOnlyModeVariables) {
  const { data, error } = await post('/v1/projects/{ref}/readonly/temporary-disable', {
    params: { path: { ref: projectRef } },
  })

  if (error) throw error
  return data
}

type DisableReadOnlyModeData = Awaited<ReturnType<typeof tempDisableReadOnlyMode>>

export const useDisableReadOnlyModeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DisableReadOnlyModeData, ResponseError, TempDisableReadOnlyModeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DisableReadOnlyModeData, ResponseError, TempDisableReadOnlyModeVariables>(
    (vars) => tempDisableReadOnlyMode(vars),
    {
      async onSuccess(data, variables, context) {
        setTimeout(() => queryClient.invalidateQueries(usageKeys.resourceWarnings()), 2000)
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to disable read only mode: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
