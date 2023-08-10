import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type ProjectInvoiceVariables = {
  id?: string
}

export async function getProjectInvoice({ id }: ProjectInvoiceVariables, signal?: AbortSignal) {
  if (!id) throw new Error('Invoice ID is required')

  const { data, error } = await get(`/platform/stripe/invoices/{id}`, {
    params: { path: { id } },
    signal,
  })

  if (error) throw error
  return data
}

export type ProjectInvoiceData = Awaited<ReturnType<typeof getProjectInvoice>>
export type ProjectInvoiceError = ResponseError

export const useProjectInvoiceQuery = <TData = ProjectInvoiceData>(
  { id }: ProjectInvoiceVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectInvoiceData, ProjectInvoiceError, TData> = {}
) =>
  useQuery<ProjectInvoiceData, ProjectInvoiceError, TData>(
    invoicesKeys.invoice(id),
    ({ signal }) => getProjectInvoice({ id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
