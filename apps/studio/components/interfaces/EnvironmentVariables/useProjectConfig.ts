import { useQuery } from '@tanstack/react-query'
import type { ProjectConfig } from '@supabase-dx/config'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

const ENV_SERVER = 'http://localhost:3457'

export type { ProjectConfig }

async function fetchProjectConfig(projectRef: string): Promise<ProjectConfig> {
  const res = await fetch(`${ENV_SERVER}/projects/${projectRef}/env?scope=config`)
  if (!res.ok) throw new Error(`env-server error: ${res.status}`)
  const vars: { key: string; value: string }[] = await res.json()
  return Object.fromEntries(vars.map((v) => [v.key, v.value])) as ProjectConfig
}

export function useProjectConfig() {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.parentRef

  return useQuery({
    queryKey: ['project-config', projectRef],
    queryFn: () => fetchProjectConfig(projectRef!),
    enabled: !!projectRef,
    retry: false,
    throwOnError: false,
  })
}
