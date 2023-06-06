import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

export type IntegrationsVariables = {
  orgSlug?: string
}

export type IntegrationProjectConnection = {
  id: string
  createdAt: string
  from: {
    name: string
  }
  to: {
    name: string
  }
}

export type Integration = {
  id: string
  type: 'VERCEL' | 'NETLIFY' | 'GITHUB'
  createdBy: string
  createdAt: string
  connections: IntegrationProjectConnection[]
}

export type IntegrationsResponse = Integration[]

export async function getIntegrations({ orgSlug }: IntegrationsVariables, signal?: AbortSignal) {
  if (!orgSlug) {
    throw new Error('orgSlug is required')
  }

  const response: IntegrationsResponse = [
    {
      id: '1',
      type: 'VERCEL',
      createdBy: 'Alaister',
      createdAt: '2023-06-05T06:56:25.565Z',
      connections: [
        {
          id: '1.1',
          createdAt: '2023-06-05T06:56:25.565Z',
          from: {
            name: 'supabase-vercel',
          },
          to: {
            name: 'alaister',
          },
        },
      ],
    },
  ]

  // const response = await get(`${API_URL}/projects/${orgSlug}/integrations`, {
  //   signal,
  // })
  // if (response.error) {
  //   throw response.error
  // }

  return response as IntegrationsResponse
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = unknown

export const useIntegrationsQuery = <TData = IntegrationsData>(
  { orgSlug }: IntegrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.list(orgSlug),
    ({ signal }) => getIntegrations({ orgSlug }, signal),
    { enabled: enabled && typeof orgSlug !== 'undefined', ...options }
  )
