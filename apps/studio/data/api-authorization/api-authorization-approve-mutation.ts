import { useMutation } from '@tanstack/react-query'

import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type ApiAuthorizationApproveVariables = {
  id: string
  slug: string
  partial?: boolean
}

type ApproveAuthorizationBody = { project_refs?: string[]; partial?: boolean }

export type ApiAuthorizationApproveResponse = {
  url: string
}

export async function approveApiAuthorization({
  id,
  slug,
  partial,
}: ApiAuthorizationApproveVariables) {
  if (!id) throw new Error('Authorization ID is required')
  if (!slug) throw new Error('Organization slug is required')

  const body: ApproveAuthorizationBody | undefined = partial ? { partial: true } : undefined

  const { data, error } = await post('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    // @ts-ignore [Joshen] Endpoint doesnt need slug in the path params, but the endpoint path requires slug
    // it's a little weird, will need API to decide if they wanna shift this route outside of the {slug} endpoint
    params: { path: { slug, id }, query: { skip_browser_redirect: true } },
    // `partial` isn't in the generated API types yet
    body: body as never,
  })

  if (error) handleError(error)
  return data as unknown as ApiAuthorizationApproveResponse
}

type ApiAuthorizationApproveData = Awaited<ReturnType<typeof approveApiAuthorization>>

export const useApiAuthorizationApproveMutation = (
  options: Omit<
    UseCustomMutationOptions<
      ApiAuthorizationApproveData,
      StudioError,
      ApiAuthorizationApproveVariables
    >,
    'mutationFn'
  > = {}
) => {
  return useMutation<ApiAuthorizationApproveData, StudioError, ApiAuthorizationApproveVariables>({
    mutationFn: (vars) => approveApiAuthorization(vars),
    ...options,
  })
}
