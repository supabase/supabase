import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type VerifyEmailVariables = {
  token: string
}

export type VerifyEmailData = {
  result: 'success'
}

export async function verifyEmail({ token }: VerifyEmailVariables): Promise<VerifyEmailData> {
  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/platform/support/verify-email`
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })

  const res = await fetchHandler(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError({ ...body, code: res.status })
  }

  return res.json() as Promise<VerifyEmailData>
}

export const useVerifyEmailMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<VerifyEmailData, ResponseError, VerifyEmailVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<VerifyEmailData, ResponseError, VerifyEmailVariables>({
    mutationFn: (vars) => verifyEmail(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to verify email: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
