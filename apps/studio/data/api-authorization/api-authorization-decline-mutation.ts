import { useMutation } from '@tanstack/react-query'

import { del, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type ApiAuthorizationDeclineVariables = {
  id: string
  slug: string
}

export type ApiAuthorizationDeclineResponse = {
  id: string
}

export async function declineApiAuthorization({ id, slug }: ApiAuthorizationDeclineVariables) {
  if (!id) throw new Error('Authorization ID is required')

  const { data, error } = await del('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    // @ts-ignore [Joshen] Endpoint doesnt need slug in the path params, but the endpoint path requires slug
    // it's a little weird, will need API to decide if they wanna shift this route outside of the {slug} endpoint
    params: { path: { slug, id } },
  })

  if (error) handleError(error)
  return data as ApiAuthorizationDeclineResponse
}

type ApiAuthorizationDeclineData = Awaited<ReturnType<typeof declineApiAuthorization>>

export const useApiAuthorizationDeclineMutation = (
  options: Omit<
    UseCustomMutationOptions<
      ApiAuthorizationDeclineData,
      StudioError,
      ApiAuthorizationDeclineVariables
    >,
    'mutationFn'
  > = {}
) => {
  return useMutation<ApiAuthorizationDeclineData, StudioError, ApiAuthorizationDeclineVariables>({
    mutationFn: (vars) => declineApiAuthorization(vars),
    ...options,
  })
}
