import { useQuery } from '@tanstack/react-query'
import { useProjectApiUrl } from 'data/config/project-endpoint-query'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomQueryOptions } from 'types'
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
  clientEndpoint: string | undefined
  projectId: string | undefined
}

export async function getInviteCodes({
  projectRef,
  clientEndpoint,
  projectId,
}: GetInviteCodesVariables): Promise<InviteCode[]> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')
  if (!projectId) throw new Error('Project ID is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)

  const { data, error } = await supabaseClient
    .schema('_admin')
    .from('invite_codes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as InviteCode[]
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
  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })

  return useQuery<InviteCodesData, InviteCodesError, TData>({
    queryKey: inviteCodeKeys.list(projectRef, clientEndpoint),
    queryFn: () => getInviteCodes({ projectRef, clientEndpoint, projectId }),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      !!clientEndpoint &&
      typeof projectId !== 'undefined',
    ...options,
  })
}
