import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { invoicesKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type UpcomingInvoiceVariables = {
  orgSlug?: string
}

export type UpcomingInvoiceResponse = components['schemas']['UpcomingInvoice']

export async function getUpcomingInvoice(
  { orgSlug }: UpcomingInvoiceVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/billing/invoices/upcoming`, {
    params: { path: { slug: orgSlug } },
    headers: { Version: '2' },
    signal,
  })

  if (error) handleError(error)
  return data as UpcomingInvoiceResponse
}

export type UpcomingInvoiceData = Awaited<ReturnType<typeof getUpcomingInvoice>>
export type UpcomingInvoiceError = ResponseError

export const useOrgUpcomingInvoiceQuery = <TData = UpcomingInvoiceData>(
  { orgSlug }: UpcomingInvoiceVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<UpcomingInvoiceData, UpcomingInvoiceError, TData> = {}
) =>
  useQuery<UpcomingInvoiceData, UpcomingInvoiceError, TData>({
    queryKey: invoicesKeys.orgUpcomingPreview(orgSlug),
    queryFn: ({ signal }) => getUpcomingInvoice({ orgSlug }, signal),
    enabled: enabled && typeof orgSlug !== 'undefined',
    ...options,
  })
