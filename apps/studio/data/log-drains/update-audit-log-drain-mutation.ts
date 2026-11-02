import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AuditLogDrainConfig } from './create-audit-log-drain-mutation'
import { logDrainsKeys } from './keys'
import { LogDrainType } from '@/components/interfaces/LogDrains/LogDrains.constants'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type AuditLogDrainUpdateVariables = {
  slug: string
  token?: string
  name: string
  description?: string
  type: LogDrainType
  config: AuditLogDrainConfig
}

export async function updateAuditLogDrain(payload: AuditLogDrainUpdateVariables) {
  if (!payload.token) {
    throw new Error('Token is required')
  }

  const { data, error } = await put(
    '/platform/organizations/{slug}/analytics/audit-log-drains/{token}',
    {
      params: { path: { slug: payload.slug, token: payload.token } },
      body: {
        name: payload.name,
        description: payload.description,
        type: payload.type,
        config: payload.config,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type AuditLogDrainUpdateData = Awaited<ReturnType<typeof updateAuditLogDrain>>

export const useUpdateAuditLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuditLogDrainUpdateData, ResponseError, AuditLogDrainUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuditLogDrainUpdateData, ResponseError, AuditLogDrainUpdateVariables>({
    mutationFn: (vars) => updateAuditLogDrain(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await queryClient.invalidateQueries({ queryKey: logDrainsKeys.auditList(slug) })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to mutate: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
