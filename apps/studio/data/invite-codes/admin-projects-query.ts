import { useQuery } from '@tanstack/react-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { executeSql } from '../sql/execute-sql-query'

export type AdminProject = {
  id: string
  name: string
  schema_name: string
  status: string
  created_at: string
}

export async function getAdminProjects({
  projectRef,
  connectionString,
}: {
  projectRef: string | undefined
  connectionString: string | null | undefined
}): Promise<AdminProject[]> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!connectionString) throw new Error('Connection string is required')

  const { result } = await executeSql<AdminProject[]>({
    projectRef,
    connectionString,
    sql: /* SQL */ `
      select id, name, schema_name, status, created_at
      from _admin.projects
      order by created_at asc;
    `,
  })

  return result
}

export type AdminProjectsData = Awaited<ReturnType<typeof getAdminProjects>>
export type AdminProjectsError = ResponseError

const adminProjectKeys = {
  list: (projectRef: string | undefined, connectionString: string | null | undefined) =>
    ['projects', projectRef, 'admin-projects', connectionString] as const,
}

export const useAdminProjectsQuery = <TData = AdminProjectsData>(
  { projectRef }: { projectRef: string | undefined },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AdminProjectsData, AdminProjectsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdminProjectsData, AdminProjectsError, TData>({
    queryKey: adminProjectKeys.list(projectRef, connectionString),
    queryFn: () => getAdminProjects({ projectRef, connectionString }),
    enabled:
      enabled && typeof projectRef !== 'undefined' && !!connectionString,
    ...options,
  })
}
