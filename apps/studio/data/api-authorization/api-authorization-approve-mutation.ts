import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ApiAuthorizationApproveVariables = {
  id: string
  slug: string
}

export type ApiAuthorizationApproveResponse = {
  url: string
}

export async function approveApiAuthorization({ id, slug }: ApiAuthorizationApproveVariables) {
  if (!id) throw new Error('Authorization ID is required')
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await post('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    // @ts-ignore [Joshen] Endpoint doesnt need slug in the path params, but the endpoint path requires slug
    // it's a little weird, will need API to decide if they wanna shift this route outside of the {slug} endpoint
    params: { path: { slug, id }, query: { skip_browser_redirect: true } },
  })

  if (error) handleError(error)
  return data as unknown as ApiAuthorizationApproveResponse
}

type ApiAuthorizationApproveData = Awaited<ReturnType<typeof approveApiAuthorization>>

export const useApiAuthorizationApproveMutation = ({
  onError,
  ...options
}: Omit<
  UseMutationOptions<ApiAuthorizationApproveData, ResponseError, ApiAuthorizationApproveVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ApiAuthorizationApproveData, ResponseError, ApiAuthorizationApproveVariables>(
    (vars) => approveApiAuthorization(vars),
    {
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to approve authorization request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
