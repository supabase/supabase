import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type DpaRequestVariables = {
  recipient_email: string
  slug: string
}

export async function requestDpa({ recipient_email, slug }: DpaRequestVariables) {
  const { data, error } = await post(`/platform/organizations/${slug}/documents/dpa` as any, {
    // Fix type later
    body: { recipient_email },
  })
  if (error) handleError(error)
  return data
}

type DpaRequestData = Awaited<ReturnType<typeof requestDpa>>

export const useDpaRequestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DpaRequestData, ResponseError, DpaRequestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DpaRequestData, ResponseError, DpaRequestVariables>({
    mutationFn: (vars) => requestDpa(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to request DPA: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
