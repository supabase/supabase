import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DeleteReplicationTenantParams = {
  projectRef: string
  tenantId: string
}

async function deleteReplicationTenant(
  { projectRef, tenantId }: DeleteReplicationTenantParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!tenantId) throw new Error('tenantId is required')

  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/platform/replication/${projectRef}/tenants/${tenantId}`
  const headers = await constructHeaders()
  const res = await fetchHandler(url, { method: 'DELETE', headers, signal })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError(body)
  }

  return res.json().catch(() => undefined)
}

type DeleteReplicationTenantData = Awaited<ReturnType<typeof deleteReplicationTenant>>

export const useDeleteReplicationTenantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DeleteReplicationTenantData,
    ResponseError,
    DeleteReplicationTenantParams
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DeleteReplicationTenantData,
    ResponseError,
    DeleteReplicationTenantParams
  >({
    mutationFn: (vars) => deleteReplicationTenant(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: replicationKeys.sources(projectRef) }),
        queryClient.invalidateQueries({ queryKey: replicationKeys.destinations(projectRef) }),
        queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable external replication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
