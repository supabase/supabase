import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { del } from 'data/fetchers'
import { ResponseError } from 'types'
import { BannedIPKeys } from './keys'

import toast from 'react-hot-toast'

export type IPDeleteVariables = {
  projectRef: string
  /** can only be one for now */
  ips: string[] // Renamed from 'ip' to 'ips'
}

export async function deleteBannedIPs({ projectRef, ips }: IPDeleteVariables) { // Updated parameter name here
  const { data, error } = await del(`/v1/projects/{ref}/network-bans`, {
    params: { 
      path: { ref: projectRef } 
    },
    body: { ipv4_addresses: ips } // Updated parameter name here
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
        const { projectRef, ips } = variables // Updated parameter name here

        await Promise.all([
          queryClient.invalidateQueries(BannedIPKeys.list(projectRef)),
          queryClient.invalidateQueries(BannedIPKeys.detail(ips)), // Updated parameter name here
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to unban ips: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
