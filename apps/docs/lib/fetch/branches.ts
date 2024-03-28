import type { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'

const branchKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
}

export interface BranchVariables {
  projectRef?: string
}

async function getBranches({ projectRef }: BranchVariables, signal?: AbortSignal) {
  if (!projectRef) throw Error('projectRef is required')

  const { data, error } = await get('/v1/projects/{ref}/branches', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })
  if (error) throw error

  return data
}

export type BranchesData = Awaited<ReturnType<typeof getBranches>>
type BranchesError = ResponseError

export function useBranchesQuery<TData = BranchesData>(
  { projectRef }: BranchVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<BranchesData, BranchesError, TData>, 'queryKey'>
) {
  return useQuery<BranchesData, BranchesError, TData>({
    queryKey: branchKeys.list(projectRef),
    queryFn: ({ signal }) => getBranches({ projectRef }, signal),
    enabled,
    ...options,
  })
}
