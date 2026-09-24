import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { analyticsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type ApiKeysLastUsedVariables = {
  projectRef?: string
  isoTimestampStart?: string
  isoTimestampEnd?: string
}

const apiKeyLastUsedSchema = z.object({
  timestamp: z.number(),
  role: z.string().optional(),
  signaturePrefix: z.string().optional(),
  keyId: z.string().optional(),
})

export type ApiKeyLastUsed = z.infer<typeof apiKeyLastUsedSchema>

const apiKeyLastUsedEndpointRowSchema = z
  .object({
    timestamp: z.number().finite(),
    role: z.string().nullish(),
    signature_prefix: z.string().nullish(),
    key_id: z.string().nullish(),
    request_sb_jwt_authorization_payload_role: z.string().nullish(),
    request_sb_jwt_authorization_payload_signature_prefix: z.string().nullish(),
    request_sb_jwt_authorization_payload_key_id: z.string().nullish(),
  })
  .transform((row): ApiKeyLastUsed => {
    const role = row.role || row.request_sb_jwt_authorization_payload_role
    const signaturePrefix =
      row.signature_prefix || row.request_sb_jwt_authorization_payload_signature_prefix
    const keyId = row.key_id || row.request_sb_jwt_authorization_payload_key_id

    const apiKeyLastUsed: ApiKeyLastUsed = { timestamp: row.timestamp }
    if (role) apiKeyLastUsed.role = role
    if (signaturePrefix) apiKeyLastUsed.signaturePrefix = signaturePrefix
    if (keyId) apiKeyLastUsed.keyId = keyId
    return apiKeyLastUsed
  })
  .pipe(apiKeyLastUsedSchema)

export const apiKeysLastUsedSchema = z.array(apiKeyLastUsedEndpointRowSchema)

export const getJWTSigningKeyLastUsedAt = (rows: ApiKeyLastUsed[], keyId: string) =>
  rows.reduce<number | undefined>((latestTimestamp, row) => {
    if (row.keyId !== keyId) return latestTimestamp
    if (latestTimestamp === undefined) return row.timestamp
    return Math.max(latestTimestamp, row.timestamp)
  }, undefined)

export async function getApiKeysLastUsed(
  { projectRef, isoTimestampStart, isoTimestampEnd }: ApiKeysLastUsedVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/api_keys.last_used.otel',
    {
      params: {
        path: { ref: projectRef },
        query: {
          iso_timestamp_start: isoTimestampStart,
          iso_timestamp_end: isoTimestampEnd,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  if (data?.error) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Failed to fetch last-used API keys'
    )
  }

  return apiKeysLastUsedSchema.parse(data?.result ?? [])
}

export type ApiKeysLastUsedData = Awaited<ReturnType<typeof getApiKeysLastUsed>>
export type ApiKeysLastUsedError = Error

export const useApiKeysLastUsedQuery = <TData = ApiKeysLastUsedData>(
  { projectRef, isoTimestampStart, isoTimestampEnd }: ApiKeysLastUsedVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ApiKeysLastUsedData, ApiKeysLastUsedError, TData> = {}
) =>
  useQuery<ApiKeysLastUsedData, ApiKeysLastUsedError, TData>({
    queryKey: analyticsKeys.apiKeysLastUsed(projectRef, { isoTimestampStart, isoTimestampEnd }),
    queryFn: ({ signal }) =>
      getApiKeysLastUsed({ projectRef, isoTimestampStart, isoTimestampEnd }, signal),
    enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
    ...options,
  })
