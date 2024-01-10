import { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { getProjects } from './projects'

const branchKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
  listAll: () => ['all-projects', 'all-branches'] as const,
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
  { enabled = true, ...options }: UseQueryOptions<BranchesData, BranchesError, TData>
) {
  return useQuery<BranchesData, BranchesError, TData>({
    queryKey: branchKeys.list(projectRef),
    queryFn: ({ signal }) => getBranches({ projectRef }, signal),
    enabled,
    ...options,
  })
}

async function getAllBranches(signal?: AbortSignal) {
  const allProjects = await getProjects(signal)

  const branchesList = await Promise.all(
    allProjects.map(async (project) => {
      // @ts-ignore -- problem with OpenAPI spec that codegen reads from
      if (!project.is_branch_enabled) {
        return null
      }

      // @ts-ignore -- problem with OpenAPI spec that codegen reads from
      const projectRef = project.ref as string
      try {
        const branches = await getBranches({ projectRef })
        return { [projectRef]: branches }
      } catch {
        return null
      }
    })
  )

  const branchesMap = branchesList.reduce((record, branch) => {
    if (!branch) {
      return record
    }
    return Object.assign(record, branch)
  }, {})
  return branchesMap
}

export type AllBranchesData = Awaited<ReturnType<typeof getAllBranches>>
type AllBranchesError = ResponseError

export function useAllProjectsBranchesQuery<TData = AllBranchesData>({
  enabled = true,
  ...options
}: Omit<UseQueryOptions<AllBranchesData, AllBranchesError, TData>, 'queryKey'> = {}) {
  return useQuery<AllBranchesData, AllBranchesError, TData>({
    queryKey: branchKeys.listAll(),
    queryFn: ({ signal }) => getAllBranches(signal),
    enabled,
    ...options,
  })
}
