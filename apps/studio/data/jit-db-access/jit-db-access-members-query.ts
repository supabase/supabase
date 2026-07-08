import { useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type JitDbAccessMembersVariables = { projectRef?: string }

async function getJitDbAccessMembers(
  { projectRef }: JitDbAccessMembersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/database/jit/list`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data.items
}

export type JitDbAccessMembersData = Awaited<ReturnType<typeof getJitDbAccessMembers>>
type JitDbAccessMembersError = ResponseError

export const useJitDbAccessMembersQuery = <TData = JitDbAccessMembersData>(
  { projectRef }: JitDbAccessMembersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<JitDbAccessMembersData, JitDbAccessMembersError, TData> = {}
) =>
  useQuery<JitDbAccessMembersData, JitDbAccessMembersError, TData>({
    queryKey: jitDbAccessKeys.members(projectRef),
    queryFn: ({ signal }) => getJitDbAccessMembers({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    ...options,
  })
