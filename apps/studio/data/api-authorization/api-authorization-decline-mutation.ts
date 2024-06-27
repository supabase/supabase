import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ApiAuthorizationDeclineVariables = {
  id: string
  slug: string
}

export type ApiAuthorizationDeclineResponse = {
  id: string
}

export async function declineApiAuthorization({ id, slug }: ApiAuthorizationDeclineVariables) {
  if (!id) throw new Error('Authorization ID is required')

  // @ts-ignore [Joshen] API Codegen is wrong, needs to be fixed
  const { data, error } = await del('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    params: { path: { slug, id } },
    body: {},
  })

  if (error) handleError(error)
  return data as ApiAuthorizationDeclineResponse
}

type ApiAuthorizationDeclineData = Awaited<ReturnType<typeof declineApiAuthorization>>

export const useApiAuthorizationDeclineMutation = ({
  onError,
  ...options
}: Omit<
  UseMutationOptions<ApiAuthorizationDeclineData, ResponseError, ApiAuthorizationDeclineVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ApiAuthorizationDeclineData, ResponseError, ApiAuthorizationDeclineVariables>(
    (vars) => declineApiAuthorization(vars),
    {
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to decline authorization request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
