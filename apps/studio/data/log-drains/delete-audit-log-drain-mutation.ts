import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { logDrainsKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type AuditLogDrainDeleteVariables = {
  slug: string
  token: string
}

export async function deleteAuditLogDrain({ slug, token }: AuditLogDrainDeleteVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/analytics/audit-log-drains/{token}',
    {
      params: { path: { slug, token } },
    }
  )

  if (error) handleError(error)
  return data
}

type AuditLogDrainDeleteData = Awaited<ReturnType<typeof deleteAuditLogDrain>>

export const useDeleteAuditLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuditLogDrainDeleteData, ResponseError, AuditLogDrainDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuditLogDrainDeleteData, ResponseError, AuditLogDrainDeleteVariables>({
    mutationFn: (vars) => deleteAuditLogDrain(vars),
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
