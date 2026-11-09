import { branchKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantForVariants } from '@/lib/grants'

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
export type BranchError = StudioError

export const branchQueryOptions = <TData = BranchData>(
  { projectRef, branchRef, grant }: BranchVariables,
  options?: GrantedQueryCallerOptions<
    BranchData,
    BranchError,
    TData,
    ReturnType<typeof branchKeys.detail>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: branchKeys.detail(projectRef, branchRef),
      queryFn:
        IS_PLATFORM && branchRef && grant
          ? ({ signal }) => getBranch({ branchRef, grant }, signal)
          : undefined,
    },
    options
  )
