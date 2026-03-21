import { useQuery } from '@tanstack/react-query'
import { literal } from '@supabase/pg-meta/src/pg-format'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { executeSql } from '../sql/execute-sql-query'
import { inviteCodeKeys } from './keys'

export type InviteCode = {
  id: string
  project_id: string
  code: string
  max_slots: number
  remaining_slots: number
  created_by: string | null
  created_at: string
}

export type GetInviteCodesVariables = {
  projectRef: string | undefined
  connectionString: string | null | undefined
  projectId: string | undefined
}

export async function getInviteCodes({
  projectRef,
  connectionString,
  projectId,
}: GetInviteCodesVariables): Promise<InviteCode[]> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!connectionString) throw new Error('Connection string is required')
  if (!projectId) throw new Error('Project ID is required')

  const { result } = await executeSql<InviteCode[]>({
    projectRef,
    connectionString,
    sql: /* SQL */ `
      select id, project_id, code, max_slots, remaining_slots, created_by, created_at
      from _admin.invite_codes
      where project_id = ${literal(projectId)}
      order by created_at desc;
    `,
  })

  return result
}

export type InviteCodesData = Awaited<ReturnType<typeof getInviteCodes>>
export type InviteCodesError = ResponseError

export const useInviteCodesQuery = <TData = InviteCodesData>(
  {
    projectRef,
    projectId,
  }: { projectRef: string | undefined; projectId: string | undefined },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<InviteCodesData, InviteCodesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<InviteCodesData, InviteCodesError, TData>({
    queryKey: inviteCodeKeys.list(projectRef, connectionString, projectId),
    queryFn: () => getInviteCodes({ projectRef, connectionString, projectId }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      !!connectionString &&
      typeof projectId !== 'undefined',
    ...options,
  })
}
