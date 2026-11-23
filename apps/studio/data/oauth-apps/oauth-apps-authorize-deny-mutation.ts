import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from '../fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeDenyVariables = {
  slug?: string
  auth_id?: string
}

export async function denyOAuthAppsAuthorize({ slug, auth_id }: OAuthAppsAuthorizeDenyVariables) {
  if (!auth_id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await del('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    params: { path: { slug, id: auth_id } },
  })
  if (error) handleError(error)
  return data
}

type OAuthAppsAuthorizeDenyData = Awaited<ReturnType<typeof denyOAuthAppsAuthorize>>

export const useOAuthAppsAuthorizeDenyMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthAppsAuthorizeDenyData,
    StudioError,
    OAuthAppsAuthorizeDenyVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<OAuthAppsAuthorizeDenyData, StudioError, OAuthAppsAuthorizeDenyVariables>({
    mutationFn: (vars) => denyOAuthAppsAuthorize(vars),
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to deny access to OAuth app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
