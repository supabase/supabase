import { queryOptions } from '@tanstack/react-query'
import type { components } from 'api-types'

import { stripeProjectsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'

type GetAccountRequestVariables = {
  arId?: string
}

export type AccountRequestDetails = components['schemas']['AccountRequestDetailsDto']

async function getAccountRequest({ arId }: GetAccountRequestVariables, signal?: AbortSignal) {
  if (!arId) throw new Error('Account request ID is required')

  const { data, error } = await get(
    '/platform/stripe/projects/provisioning/account_requests/{id}',
    {
      params: { path: { id: arId } },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export const accountRequestQueryOptions = (
  { arId }: GetAccountRequestVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: stripeProjectsKeys.get(arId),
    queryFn: ({ signal }) => getAccountRequest({ arId }, signal),
    enabled: enabled && typeof arId !== 'undefined',
  })
}
