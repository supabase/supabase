import { useQuery } from '@tanstack/react-query'

import type { SiteFileEntry } from '@/lib/api/self-hosted/hosting/types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteFilesVariables = { projectRef?: string; slug?: string }
export type SiteFilesData = SiteFileEntry[]
export type SiteFilesError = ResponseError

export async function getSiteFiles({ projectRef, slug }: SiteFilesVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  return sitesApiFetch<SiteFileEntry[]>(`/v1/projects/${projectRef}/sites/${slug}/files`)
}

export const useSiteFilesQuery = <TData = SiteFilesData>(
  { projectRef, slug }: SiteFilesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<SiteFilesData, SiteFilesError, TData> = {}
) =>
  useQuery<SiteFilesData, SiteFilesError, TData>({
    queryKey: sitesKeys.files(projectRef, slug),
    queryFn: () => getSiteFiles({ projectRef, slug }),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
    ...options,
  })
