import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

// repos fetch
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
  metadata?: {
    vercelTeam?: string
    gitHubConnectionOwner?: string
  }
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
      createdBy: 'alaister@supabase.io',
      createdAt: '2023-06-05T06:56:25.565Z',
      metadata: {
        vercelTeam: 'alaister-team',
      },
      connections: [
        {
          id: '1.0',
          createdAt: '2023-06-05T01:56:25.565Z',
          to: {
            name: 'www prod',
          },
          from: {
            name: 'alaister project prod',
          },
        },
        {
          id: '1.1',
          createdAt: '2023-06-14T06:56:25.565Z',
          to: {
            name: 'www staging',
          },
          from: {
            name: 'alaister project staging',
          },
        },
        {
          id: '1.1',
          createdAt: '2023-06-02T21:56:25.565Z',
          to: {
            name: 'bees knees',
          },
          from: {
            name: 'jonny bee project',
          },
        },
      ],
    },
    {
      id: '2',
      type: 'VERCEL',
      createdBy: 'alaister@supabase.io',
      createdAt: '2023-06-05T06:56:25.565Z',
      metadata: {
        vercelTeam: 'alaister-team',
      },
      connections: [],
    },
    {
      id: '3',
      type: 'GITHUB',
      createdBy: 'Alaister',
      createdAt: '2023-06-05T06:56:25.565Z',
      metadata: {
        gitHubConnectionOwner: 'alaister',
      },
      connections: [
        {
          id: '1.2',
          createdAt: '2023-06-05T06:56:25.565Z',
          to: {
            name: 'supabase/supabase',
          },
          from: {
            name: 'alaister project',
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

export const useIntegrationsGitHubReposQuery = <TData = IntegrationsData>(
  { orgSlug }: IntegrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.integrationsList(), // TODO: make a unique key for github repos
    ({ signal }) => getIntegrations({ orgSlug }, signal),
    { enabled: enabled && typeof orgSlug !== 'undefined', ...options }
  )
