import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type AuditLogDrainTestVariables = {
  slug: string
  token: string
}

export async function testAuditLogDrain({ slug, token }: AuditLogDrainTestVariables) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/analytics/audit-log-drains/{token}/test',
    {
      params: { path: { slug, token } },
    }
  )

  if (error) handleError(error)
  return data
}

type AuditLogDrainTestData = Awaited<ReturnType<typeof testAuditLogDrain>>

export const useTestAuditLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuditLogDrainTestData, ResponseError, AuditLogDrainTestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<AuditLogDrainTestData, ResponseError, AuditLogDrainTestVariables>({
    mutationFn: (vars) => testAuditLogDrain(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to test log drain: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
