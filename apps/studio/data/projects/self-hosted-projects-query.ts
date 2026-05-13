import { useQuery } from '@tanstack/react-query'

import { IS_PLATFORM } from '@/lib/constants'

export type SelfHostedProjectItem = {
  id: number
  ref: string
  name: string
  organization_id: number
  cloud_provider: string
  status: string
  region: string
  inserted_at: string
}

async function fetchSelfHostedProjects(): Promise<SelfHostedProjectItem[]> {
  const response = await fetch('/api/platform/projects', {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch projects')
  return response.json()
}

/**
 * Fetches the list of configured self-hosted projects.
 * Only enabled in non-platform (self-hosted) mode.
 */
export function useSelfHostedProjectsQuery() {
  return useQuery({
    queryKey: ['self-hosted-projects'],
    queryFn: fetchSelfHostedProjects,
    enabled: !IS_PLATFORM,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
