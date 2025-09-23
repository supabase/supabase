import * as Sentry from '@sentry/nextjs'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export async function addLoginEvent() {
  const { error } = await post('/platform/profile/audit-login')
  if (error) handleError(error)
}

type AddLoginEventVariables = {}
type AddLoginEventData = Awaited<ReturnType<typeof addLoginEvent>>

export const useAddLoginEvent = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AddLoginEventData, ResponseError, AddLoginEventVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<AddLoginEventData, ResponseError, AddLoginEventVariables>(
    (vars) => addLoginEvent(),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        Sentry.captureException(
          new Error("Failed to add login event to user's audit log", { cause: data })
        )
        if (onError === undefined) {
          toast.error(`Failed to add login event: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
