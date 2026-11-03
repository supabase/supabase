import { queryOptions, skipToken } from '@tanstack/react-query'

import { branchKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { GrantForVariants } from '@/lib/grants'
import type { ResponseError } from '@/types'

export type BranchGrant = GrantForVariants<'get', '/v1/branches/{branch_id_or_ref}'>

export type BranchVariables = {
  branchRef?: string
  projectRef?: string
  grant?: BranchGrant
}

async function getBranch(
  { branchRef, grant }: { branchRef: string; grant: BranchGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get(`/v1/branches/{branch_id_or_ref}`, {
    params: { path: { branch_id_or_ref: branchRef } },
    signal,
    grant,
  })

  if (error) handleError(error)
  return data
}

export type BranchData = Awaited<ReturnType<typeof getBranch>>
export type BranchError = ResponseError

export const branchQueryOptions = ({ projectRef, branchRef, grant }: BranchVariables) =>
  queryOptions<BranchData, BranchError>({
    queryKey: branchKeys.detail(projectRef, branchRef),
    queryFn:
      IS_PLATFORM && branchRef && grant
        ? ({ signal }) => getBranch({ branchRef, grant }, signal)
        : skipToken,
  })
