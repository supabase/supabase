import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import {
  RawAuthMetricsResponseSchema,
  type RawAuthMetricsResponse,
} from 'components/interfaces/Auth/Overview/OverviewUsage.schema'
import type { UseCustomQueryOptions } from 'types'
import { authKeys } from './keys'

export type AuthOverviewVariables = {
  projectRef?: string
}

export async function getAuthOverviewMetrics(
  { projectRef }: AuthOverviewVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/auth.metrics' as any,
    {
      params: {
        path: { ref: projectRef },
        query: { interval: '1day' },
      },
      signal,
    }
  )
  if (error) handleError(error)

  const parsed = RawAuthMetricsResponseSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new Error(`Invalid auth metrics response: ${first?.message ?? 'Invalid shape'}`)
  }
  return parsed.data as RawAuthMetricsResponse
}

export type AuthOverviewData = Awaited<ReturnType<typeof getAuthOverviewMetrics>>
export type AuthOverviewError = unknown

export const useAuthOverviewQuery = <TData = AuthOverviewData>(
  { projectRef }: AuthOverviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AuthOverviewData, AuthOverviewError, TData> = {}
) =>
  useQuery<AuthOverviewData, AuthOverviewError, TData>({
    queryKey: authKeys.overviewMetrics(projectRef),
    queryFn: ({ signal }) => getAuthOverviewMetrics({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
