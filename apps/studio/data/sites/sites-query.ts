import { useQuery } from '@tanstack/react-query'

import type { Site } from '@/lib/api/self-hosted/hosting/types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SitesVariables = { projectRef?: string }
export type SitesData = Site[]
export type SitesError = ResponseError

export async function getSites({ projectRef }: SitesVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return sitesApiFetch<Site[]>(`/v1/projects/${projectRef}/sites`)
}

export const useSitesQuery = <TData = SitesData>(
  { projectRef }: SitesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<SitesData, SitesError, TData> = {}
) =>
  useQuery<SitesData, SitesError, TData>({
    queryKey: sitesKeys.list(projectRef),
    queryFn: () => getSites({ projectRef }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
