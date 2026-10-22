import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { awsAccountKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

type AWSAccountsVariables = {
  projectRef?: string
}

async function getAWSAccounts({ projectRef }: AWSAccountsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get('/v2/projects/{ref}/private-link/associations', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })

  if (error) handleError(error)
  return (data?.data ?? []).map(({ attributes }) => attributes)
}

export type AWSAccount = Awaited<ReturnType<typeof getAWSAccounts>>[number]

type AWSAccountsData = Awaited<ReturnType<typeof getAWSAccounts>>
type AWSAccountsError = ResponseError

export const useAWSAccountsQuery = <TData = AWSAccountsData>(
  { projectRef }: AWSAccountsVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<AWSAccountsData, AWSAccountsError, TData>, 'queryKey' | 'queryFn'> = {}
) => {
  return useQuery<AWSAccountsData, AWSAccountsError, TData>({
    queryKey: awsAccountKeys.list(projectRef),
    queryFn: ({ signal }) => getAWSAccounts({ projectRef }, signal),
    enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
    refetchInterval: (query) => {
      // Poll every 5 seconds if any accounts are in transitional states
      const accounts = query.state.data
      const hasTransitionalStates = accounts?.some(
        (account: AWSAccount) => account.status === 'CREATING' || account.status === 'DELETING'
      )
      return hasTransitionalStates ? 5000 : false
    },
    ...options,
  })
}
