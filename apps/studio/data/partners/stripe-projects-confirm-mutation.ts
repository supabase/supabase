import { useMutation } from '@tanstack/react-query'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type ConfirmAccountRequestVariables = {
  arId: string
}

async function confirmAccountRequest({ arId }: ConfirmAccountRequestVariables) {
  if (!arId) throw new Error('Account request ID is required')

  const { data, error } = await post(
    '/platform/stripe/projects/provisioning/account_requests/{id}/confirm',
    { params: { path: { id: arId } } }
  )

  if (error) handleError(error)
  return data
}

type ConfirmAccountRequestData = Awaited<ReturnType<typeof confirmAccountRequest>>

export const useConfirmAccountRequestMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ConfirmAccountRequestData,
    ResponseError,
    ConfirmAccountRequestVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation({
    mutationFn: (vars) => confirmAccountRequest(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
