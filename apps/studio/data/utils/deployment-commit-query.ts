import { useQuery } from '@tanstack/react-query'

import { fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export async function getDeploymentCommit() {
  // Deliberately unpinned: API fetches never carry the `?dpl=` skew-protection
  // pin — only built asset URLs do (TanStack, see skewProtectionDpl in
  // vite.config.ts) — so Vercel's edge routes this to the LATEST deployment
  // and the check can detect a newer version while the session's assets stay
  // pinned. We keep the basePath URL so it still routes to studio in
  // production (root `/api/*` there is the marketing site).
  const response = await fetchHandler(`${BASE_PATH}/api/get-deployment-commit`)
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
