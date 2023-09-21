import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { BannedIPKeys } from './keys'

import toast from 'react-hot-toast'
import { patch } from 'data/fetchers'

export type IPDeleteVariables = {
  projectRef: string
  ip: number
  updatedParam: string
}

export async function deleteBannedIPs({ projectRef, ip }: IPDeleteVariables) {
  // @ts-ignore Just sample, TS lint will validate if the endpoint is valid
  const { data, error } = await del(`/v1/projects/{ref}/network-bans`, {
    params: { 
      path: { ref: projectRef } 
    },
    data: { ip }
  })

  if (error) throw error
  return data
}

type IPDeleteData = Awaited<ReturnType<typeof deleteBannedIPs>>

export const useBannedIPsDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<IPDeleteData, ResponseError, IPDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<IPDeleteData, ResponseError, IPDeleteVariables>(
    (vars) => deleteBannedIPs(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, ip } = variables

        await Promise.all([
          queryClient.invalidateQueries(BannedIPKeys.list(projectRef)),
          queryClient.invalidateQueries(BannedIPKeys.detail(ip)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete ip: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
