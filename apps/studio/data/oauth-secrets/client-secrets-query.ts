import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { clientSecretKeys } from './keys'

import { components } from 'api-types'

export type Secret =
  components['schemas']['ListOAuthAppClientSecretsResponse']['client_secrets'][0] & {
    client_secret?: components['schemas']['CreateOAuthAppClientSecretResponse']['client_secret']
  }

export type CreatedSecret = components['schemas']['CreateOAuthAppClientSecretResponse']

export interface SecretRowProps {
  secret: Secret
  appId?: string
  isNew?: boolean
}

type ClientSecretsVariables = {
  slug?: string
  appId?: string
}

export async function getClientSecrets(
  { slug, appId }: ClientSecretsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')
  if (!appId) throw new Error('appId is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/oauth/apps/{app_id}/client-secrets',
    {
      params: {
        path: { slug, app_id: appId },
      },
      signal,
    }
  )
  if (error) handleError(error)
  return data
}

export type ClientSecretsData = Awaited<ReturnType<typeof getClientSecrets>>
export type ClientSecretsError = ResponseError

export const useClientSecretsQuery = <TData = ClientSecretsData>(
  { slug, appId }: ClientSecretsVariables,
  { enabled = true, ...options }: UseQueryOptions<ClientSecretsData, ClientSecretsError, TData> = {}
) =>
  useQuery<ClientSecretsData, ClientSecretsError, TData>(
    clientSecretKeys.list(slug, appId),
    ({ signal }) => getClientSecrets({ slug, appId }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined' && typeof appId !== 'undefined',
      ...options,
    }
  )
