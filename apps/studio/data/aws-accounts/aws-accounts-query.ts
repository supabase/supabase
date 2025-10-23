import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { get, handleError } from 'data/fetchers'
import { awsAccountKeys } from './keys'

export type AWSAccountsVariables = {
  projectRef?: string
}

export interface AWSAccount {
  aws_account_id: string
  account_name?: string
  status: 'CREATING' | 'READY' | 'ASSOCIATION_REQUEST_EXPIRED' | 'ASSOCIATION_ACCEPTED' | 'CREATION_FAILED' | 'DELETING'
  shared_at: string | null
}

export async function getAWSAccounts({ projectRef }: AWSAccountsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}/privatelink/associations', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })

  if (error) handleError(error)
  return data.private_link_associations as AWSAccount[]
}

export type AWSAccountsData = Awaited<ReturnType<typeof getAWSAccounts>>
export type AWSAccountsError = ResponseError

export const useAWSAccountsQuery = <TData = AWSAccountsData>(
  { projectRef }: AWSAccountsVariables,
  { enabled = true, ...options }: UseQueryOptions<AWSAccountsData, AWSAccountsError, TData> = {}
) =>
  useQuery<AWSAccountsData, AWSAccountsError, TData>(
    awsAccountKeys.list(projectRef),
    ({ signal }) => getAWSAccounts({ projectRef }, signal),
    {
      enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
      refetchInterval: (data) => {
        // Poll every 5 seconds if any accounts are in transitional states
        const accounts = data as unknown as AWSAccount[]
        const hasTransitionalStates = accounts?.some(
          (account: AWSAccount) => account.status === 'CREATING' || account.status === 'DELETING'
        )
        return hasTransitionalStates ? 5000 : false
      },
      ...options,
    }
  )
