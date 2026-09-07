import { useQuery } from '@tanstack/react-query'

export type ProjectStatus = 'ACTIVE_HEALTHY' | 'COMING_UP' | 'INACTIVE' | 'UNKNOWN'

export interface ContainerStatus {
  name: string
  state: string
  health: string | null
}

export interface ProjectStatusData {
  ref: string
  status: ProjectStatus
  containers: ContainerStatus[]
}

export async function getProjectStatus(ref: string): Promise<ProjectStatusData> {
  const response = await fetch(`/api/platform/projects/${ref}/status`)
  if (!response.ok) {
    throw new Error(`Failed to fetch status for project "${ref}"`)
  }
  return response.json()
}

export function useProjectStatus(
  ref: string | undefined,
  options: { enabled?: boolean; refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: ['project-status', ref],
    queryFn: () => getProjectStatus(ref!),
    enabled: !!ref && options.enabled !== false,
    // Poll every 5s by default when a project is being created
    refetchInterval: options.refetchInterval ?? 5000,
    // Don't throw on error — show UNKNOWN status instead
    retry: 1,
  })
}

// Backward-compatible wrapper for existing Studio code
// (BuildingState, PausingState, RestoringState) which calls:
//   useProjectStatusQuery({ projectRef: ref }, { enabled, refetchInterval })
export function useProjectStatusQuery(
  params: { projectRef: string | undefined },
  options: { enabled?: boolean; refetchInterval?: number | ((query: any) => number | false) } = {}
) {
  const { projectRef } = params
  return useQuery({
    queryKey: ['project-status', projectRef],
    queryFn: () => getProjectStatus(projectRef!),
    enabled: !!projectRef && options.enabled !== false,
    refetchInterval: options.refetchInterval as number | false | undefined,
    retry: 1,
  })
}