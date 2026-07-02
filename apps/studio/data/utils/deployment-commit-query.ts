import { useQuery } from '@tanstack/react-query'

import { fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export async function getDeploymentCommit() {
  // `credentials: 'omit'` drops cookies for this one request — including the
  // `__vdpl` skew-protection pin (TanStack, see router.tsx). With no pin cookie,
  // Vercel's edge routes it to the LATEST deployment, so this check can detect a
  // newer version even while the rest of the session stays pinned. The endpoint
  // is public (no auth needed), and we keep the basePath URL so it still routes
  // to studio in production (root `/api/*` there is the marketing site).
  const response = await fetchHandler(`${BASE_PATH}/api/get-deployment-commit`, {
    credentials: 'omit',
  })
  return (await response.json()) as { commitSha: string; commitTime: string }
}

export type DeploymentCommitData = Awaited<ReturnType<typeof getDeploymentCommit>>

export const useDeploymentCommitQuery = <TData = DeploymentCommitData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<DeploymentCommitData, ResponseError, TData> = {}) =>
  useQuery<DeploymentCommitData, ResponseError, TData>({
    queryKey: ['deployment-commit'],
    queryFn: () => getDeploymentCommit(),
    ...options,
  })
