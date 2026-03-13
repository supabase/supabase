import { useQuery } from '@tanstack/react-query'
import { useProjectApiUrl } from 'data/config/project-endpoint-query'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomQueryOptions } from 'types'

export type AdminProject = {
  id: string
  name: string
  schema_name: string
  status: string
  created_at: string
}

export async function getAdminProjects({
  projectRef,
  clientEndpoint,
}: {
  projectRef: string | undefined
  clientEndpoint: string | undefined
}): Promise<AdminProject[]> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)

  const { data, error } = await supabaseClient
    .schema('_admin')
    .from('projects')
    .select('id, name, schema_name, status, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as AdminProject[]
}

export type AdminProjectsData = Awaited<ReturnType<typeof getAdminProjects>>
export type AdminProjectsError = ResponseError

const adminProjectKeys = {
  list: (projectRef: string | undefined, clientEndpoint: string | undefined) =>
    ['projects', projectRef, 'admin-projects', clientEndpoint] as const,
}

export const useAdminProjectsQuery = <TData = AdminProjectsData>(
  { projectRef }: { projectRef: string | undefined },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AdminProjectsData, AdminProjectsError, TData> = {}
) => {
  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })

  return useQuery<AdminProjectsData, AdminProjectsError, TData>({
    queryKey: adminProjectKeys.list(projectRef, clientEndpoint),
    queryFn: () => getAdminProjects({ projectRef, clientEndpoint }),
    enabled:
      enabled && typeof projectRef !== 'undefined' && !!clientEndpoint,
    ...options,
  })
}
