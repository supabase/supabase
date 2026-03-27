import { useQuery } from '@tanstack/react-query'

import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { ResponseError, type UseCustomQueryOptions } from 'types'

import { aiKeys } from './keys'

export type HomeSummaryVariables = {
  prompt: string
  projectRef: string
  orgSlug?: string
  model?: string
}

export async function generateHomeSummary(
  { prompt, projectRef, orgSlug, model }: HomeSummaryVariables,
  signal?: AbortSignal
) {
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(`${BASE_PATH}/api/ai/home-summary`, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      prompt,
      projectRef,
      ...(orgSlug ? { orgSlug } : {}),
      ...(model ? { model } : {}),
    }),
    signal,
  })

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error?: unknown }).error)
        : 'Failed to generate summary'
    throw new ResponseError(msg, response.status)
  }

  if (!body || typeof body !== 'object' || !('summary' in body)) {
    throw new ResponseError('Invalid response from home summary', response.status)
  }

  return body as { summary: string }
}

export type HomeSummaryData = Awaited<ReturnType<typeof generateHomeSummary>>

export const useHomeSummaryQuery = <TData = HomeSummaryData>({
  projectRef,
  orgSlug,
  inputDigest,
  prompt,
  model,
  enabled = true,
  ...options
}: HomeSummaryVariables & {
  inputDigest: string
  enabled?: boolean
} & Omit<
    UseCustomQueryOptions<HomeSummaryData, ResponseError, TData>,
    'queryKey' | 'queryFn' | 'enabled'
  >) => {
  const platformReady = !IS_PLATFORM || Boolean(orgSlug)

  return useQuery<HomeSummaryData, ResponseError, TData>({
    queryKey: aiKeys.homeSummary(projectRef, inputDigest),
    queryFn: ({ signal }) =>
      generateHomeSummary({ prompt, projectRef, orgSlug, model }, signal),
    enabled:
      enabled &&
      Boolean(projectRef) &&
      prompt.length > 0 &&
      platformReady,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}
