import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { logDrainsKeys } from './keys'
import { LogDrainType } from '@/components/interfaces/LogDrains/LogDrains.constants'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type AuditLogDrainCreateVariables = {
  slug: string
  name: string
  description: string
  config: Record<string, never>
  type: LogDrainType
}

export async function createAuditLogDrain(payload: AuditLogDrainCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/analytics/audit-log-drains', {
    params: { path: { slug: payload.slug } },
    body: {
      name: payload.name,
      description: payload.description,
      type: payload.type,
      config: payload.config as any,
    },
  })

  if (error) handleError(error)
  return data
}

type AuditLogDrainCreateData = Awaited<ReturnType<typeof createAuditLogDrain>>

export const useCreateAuditLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuditLogDrainCreateData, ResponseError, AuditLogDrainCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuditLogDrainCreateData, ResponseError, AuditLogDrainCreateVariables>({
    mutationFn: (vars) => createAuditLogDrain(vars),
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
