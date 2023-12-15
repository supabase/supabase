import { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { useProjectsQuery } from './projects'
import { useState } from 'react'

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
  { enabled = true, ...options }: UseQueryOptions<BranchesData, BranchesError, TData>
) {
  return useQuery<BranchesData, BranchesError, TData>({
    queryKey: branchKeys.list(projectRef),
    queryFn: ({ signal }) => getBranches({ projectRef }, signal),
    enabled,
    ...options,
  })
}

export function useAllProjectsBranchesQuery<TData = BranchesData>({
  enabled = true,
}: Omit<UseQueryOptions<BranchesData, BranchesError, TData>, 'queryKey'> = {}) {
  const [isPending, setIsPending] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<Record<string, BranchesData>>()

  const { data: allProjects, isError: projectsIsError } = useProjectsQuery({ enabled })

  if (data) {
    // Skip processing so that existing data is returned, rather than fetching again
    // In future, may way to add support for query keys and refetching
  } else if (projectsIsError) {
    setIsError(true)
    setIsPending(false)
  } else {
    Promise.all(
      (allProjects ?? []).map(async (project) => {
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
      .then((branches) => {
        const formattedBranches = branches.reduce((record, branch) => {
          if (!branch) {
            return record
          }
          return Object.assign(record, branch)
        }, {})
        return setData(formattedBranches)
      })
      .catch(() => setIsError(true))
      .finally(() => setIsPending(false))
  }

  return {
    isPending,
    isError,
    data,
  }
}
