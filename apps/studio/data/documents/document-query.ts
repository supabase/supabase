import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { documentKeys } from './keys'

export type DocType = 'standard-security-questionnaire' | 'soc2-type-2-report'

export type DocumentVariables = {
  orgSlug?: string
  docType?: DocType
}

export async function getDocument({ orgSlug, docType }: DocumentVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')

  if (docType === 'standard-security-questionnaire') {
    const { data, error } = await get(
      `/platform/organizations/{slug}/documents/standard-security-questionnaire`,
      {
        params: { path: { slug: orgSlug } },
        signal,
      }
    )

    if (error) handleError(error)
    return data as { fileUrl: string }
  }

  if (docType === 'soc2-type-2-report') {
    const { data, error } = await get(
      `/platform/organizations/{slug}/documents/soc2-type-2-report`,
      {
        params: { path: { slug: orgSlug } },
        signal,
      }
    )
    if (error) throw error

    return data as { fileUrl: string }
  }
}

export type DocumentData = Awaited<ReturnType<typeof getDocument>>
export type DocumentError = ResponseError

export const useDocumentQuery = <TData = DocumentData>(
  { orgSlug, docType }: DocumentVariables,
  { enabled = true, ...options }: UseQueryOptions<DocumentData, DocumentError, TData> = {}
) =>
  useQuery<DocumentData, DocumentError, TData>(
    documentKeys.resource(orgSlug, docType),
    ({ signal }) => getDocument({ orgSlug, docType }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined' && typeof docType !== 'undefined',
      ...options,
    }
  )
