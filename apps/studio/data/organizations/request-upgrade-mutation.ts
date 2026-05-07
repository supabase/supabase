import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type PlanRequest = components['schemas']['RequestUpgradeBody']['requested_plan']

type SendUpgradeRequestVariables = {
  slug?: string
  plan: PlanRequest
  note?: string
}

async function sendUpgradeRequest({ slug, plan, note }: SendUpgradeRequestVariables) {
  if (!slug) throw new Error('Slug is required')

  const { data, error } = await post('/platform/organizations/{slug}/billing/upgrade-request', {
    params: { path: { slug } },
    body: { requested_plan: plan, note },
  })

  if (error) handleError(error)
  return data
}

type SendUpgradeRequestData = Awaited<ReturnType<typeof sendUpgradeRequest>>

export const useSendUpgradeRequestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SendUpgradeRequestData, ResponseError, SendUpgradeRequestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SendUpgradeRequestData, ResponseError, SendUpgradeRequestVariables>({
    mutationFn: (vars) => sendUpgradeRequest(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to send upgrade request: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
