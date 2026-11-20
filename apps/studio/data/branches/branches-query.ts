import { branchKeys } from './keys'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'
import { EMPTY_ARR } from '@/lib/void'

export type BranchesGrant = GrantFor<'get', '/v1/projects/{ref}/branches'>

export type BranchesVariables = {
  projectRef?: string
  grant?: BranchesGrant
}

export type Branch = components['schemas']['BranchResponse_Output']

async function getBranches(
  { projectRef, grant }: { projectRef: string; grant: BranchesGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get(`/v1/projects/{ref}/branches`, {
    params: { path: { ref: projectRef } },
    signal,
    grant,
  })

  if (error) {
    if ((error as StudioError).message === 'Preview branching is not enabled for this project.') {
      return EMPTY_ARR
    } else {
      handleError(error)
    }
  }

  return Array.isArray(data) ? data : EMPTY_ARR
}

export type BranchesData = Awaited<ReturnType<typeof getBranches>>
export type BranchesError = StudioError

export const branchesQueryOptions = <TData = BranchesData>(
  { projectRef, grant }: BranchesVariables,
  options?: GrantedQueryCallerOptions<
    BranchesData,
    BranchesError,
    TData,
    ReturnType<typeof branchKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: branchKeys.list(projectRef),
      queryFn:
        IS_PLATFORM && projectRef && grant
          ? ({ signal }) => getBranches({ projectRef, grant }, signal)
          : undefined,
    },
    options
  )
