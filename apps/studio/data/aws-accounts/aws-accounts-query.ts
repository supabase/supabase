import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { awsAccountKeys } from './keys'

export type AWSAccountsVariables = {
  projectRef?: string
}

export interface AWSAccount {
  id: string
  awsAccountId: string
  description: string
  status: 'connected' | 'pending'
}

export async function getAWSAccounts({ projectRef }: AWSAccountsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  // Mocked data
  const data: AWSAccount[] = [
    {
      id: '1',
      awsAccountId: '123456789012',
      description: 'Production Account',
      status: 'connected',
    },
    { id: '2', awsAccountId: '210987654321', description: 'Staging Account', status: 'pending' },
  ]

  return data
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
    { enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined', ...options }
  )
