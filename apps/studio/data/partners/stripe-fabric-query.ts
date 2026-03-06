import { queryOptions } from '@tanstack/react-query'
import type { components } from 'api-types'

import { get, handleError } from '../fetchers'
import { stripeFabricKeys } from './keys'

type GetAccountRequestVariables = {
  arId?: string
}

export type AccountRequestDetails = components['schemas']['AccountRequestDetailsDto']

async function getAccountRequest({ arId }: GetAccountRequestVariables, signal?: AbortSignal) {
  if (!arId) throw new Error('Account request ID is required')

  const { data, error } = await get('/platform/stripe/fabric/provisioning/account_requests/{id}', {
    params: { path: { id: arId } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export const accountRequestQueryOptions = (
  { arId }: GetAccountRequestVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: stripeFabricKeys.get(arId),
    queryFn: ({ signal }) => getAccountRequest({ arId }, signal),
    enabled: enabled && typeof arId !== 'undefined',
  })
}
