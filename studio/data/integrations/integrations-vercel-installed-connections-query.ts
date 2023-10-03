import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { integrationKeys } from './keys'

export type VercelProjectsVariables = {
  organization_integration_id?: string
}

export type VercelProjectsResponse = {
  id: string
  name: string
  metadata: {
    id: string
    name: string
    framework: string
    link: string
  }
}

export async function getVercelInstalledConnections(
  { organization_integration_id }: VercelProjectsVariables,
  signal?: AbortSignal
) {
  if (!organization_integration_id) {
    throw new Error('organization_integration_id is required')
  }

  const response = await get(
    `${API_URL}/integrations/vercel/connections/${organization_integration_id}`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response as VercelProjectsResponse[]
}

export type VercelProjectsData = Awaited<ReturnType<typeof getVercelInstalledConnections>>
export type VercelProjectsError = unknown

export const useVercelProjectConnectionsQuery = <TData = VercelProjectsData>(
  { organization_integration_id }: VercelProjectsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<VercelProjectsData, VercelProjectsError, TData> = {}
) =>
  useQuery<VercelProjectsData, VercelProjectsError, TData>(
    integrationKeys.vercelConnectionsList(organization_integration_id),
    ({ signal }) => getVercelInstalledConnections({ organization_integration_id }, signal),
    {
      enabled: enabled && typeof organization_integration_id !== 'undefined',
      ...options,
    }
  )
