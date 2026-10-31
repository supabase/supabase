import { queryOptions, skipToken } from '@tanstack/react-query'

import { branchKeys } from './keys'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { GrantFor } from '@/lib/grants'
import { EMPTY_ARR } from '@/lib/void'
import type { ResponseError } from '@/types'

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
    if ((error as ResponseError).message === 'Preview branching is not enabled for this project.') {
      return EMPTY_ARR
    } else {
      handleError(error)
    }
  }

  return Array.isArray(data) ? data : EMPTY_ARR
}

export type BranchesData = Awaited<ReturnType<typeof getBranches>>
export type BranchesError = ResponseError

export const branchesQueryOptions = ({ projectRef, grant }: BranchesVariables) =>
  queryOptions<BranchesData, BranchesError>({
    queryKey: branchKeys.list(projectRef),
    queryFn:
      IS_PLATFORM && projectRef && grant
        ? ({ signal }) => getBranches({ projectRef, grant }, signal)
        : skipToken,
  })
