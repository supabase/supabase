import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { post, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

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
  UseMutationOptions<DpaRequestData, ResponseError, DpaRequestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DpaRequestData, ResponseError, DpaRequestVariables>(
    (vars) => requestDpa(vars),
    {
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
    }
  )
}
