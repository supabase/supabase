import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM } from '@/lib/constants'

export interface SelfHostedProject {
  ref: string
  name: string
  db_host: string
  db_port: number
  status: string
}

/**
 * Fetches all projects from the registry API in self-hosted (multi-database) mode.
 *
 * In platform mode this hook is disabled — the platform uses org-scoped queries
 * (useProjectsQuery / org-projects-infinite-query) instead.
 *
 * In self-hosted mode Studio calls GET /api/platform/projects which is backed by
 * the registry introduced in Layer 2. The response shape is an array of
 * SelfHostedProject objects.
 */
export function useSelfHostedProjects() {
  return useQuery({
    queryKey: ['self-hosted-projects'],
    queryFn: async (): Promise<SelfHostedProject[]> => {
      const response = await fetch('/api/platform/projects')
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
      }
      return response.json()
    },
    enabled: !IS_PLATFORM,
    staleTime: 30_000,
  })
}