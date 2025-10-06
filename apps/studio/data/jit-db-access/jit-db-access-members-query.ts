import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { jitDbAccessKeys } from './keys'

export type JitDbAccessMembersVariables = { projectRef?: string }

export async function getJitDbAccessMembers(
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
export type JitDbAccessMembersError = unknown

export const useJitDbAccessMembersQuery = <TData = JitDbAccessMembersData>(
  { projectRef }: JitDbAccessMembersVariables,
  { enabled = true, ...options }: UseQueryOptions<JitDbAccessMembersData, JitDbAccessMembersError, TData> = {}
) =>
  useQuery<JitDbAccessMembersData, JitDbAccessMembersError, TData>(
    jitDbAccessKeys.members(projectRef),
    ({ signal }) => getJitDbAccessMembers({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', refetchOnWindowFocus: false, ...options }
  )
