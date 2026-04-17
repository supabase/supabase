import { useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import type { JitDbAccessUnavailableReason } from '@/components/interfaces/Settings/Database/JitDatabaseAccess/JitDbAccess.types'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type JitDbAccessVariables = { projectRef?: string }

const UNAVAILABLE_REASONS: JitDbAccessUnavailableReason[] = [
  'manual_migration_required',
  'postgres_upgrade_required',
  'temporarily_unavailable',
]

function getUnavailableReason(reason?: unknown): JitDbAccessUnavailableReason {
  return UNAVAILABLE_REASONS.includes(reason as JitDbAccessUnavailableReason)
    ? (reason as JitDbAccessUnavailableReason)
    : 'temporarily_unavailable'
}

function createUnavailableState(unavailableReason?: JitDbAccessUnavailableReason) {
  return {
    appliedSuccessfully: false,
    state: 'unavailable' as const,
    isUnavailable: true,
    unavailableReason: unavailableReason ?? 'temporarily_unavailable',
  }
}

async function getJitDbAccessConfiguration(
  { projectRef }: JitDbAccessVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/jit-access`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  // Temporary access may be unavailable for several reasons (e.g. Postgres
  // upgrade required, manual migration required). Errors are thrown; the
  // unavailable state is communicated via a structured 200 response instead.
  if (error) {
    handleError(error)
  }

  if (data && 'state' in data && data.state === 'unavailable') {
    return createUnavailableState(
      getUnavailableReason('unavailableReason' in data ? data.unavailableReason : undefined)
    )
  }

  return data
}

type JitDbAccessData = Awaited<ReturnType<typeof getJitDbAccessConfiguration>>

export const useJitDbAccessQuery = <TData = JitDbAccessData>(
  { projectRef }: JitDbAccessVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<JitDbAccessData, ResponseError, TData> = {}
) =>
  useQuery<JitDbAccessData, ResponseError, TData>({
    queryKey: jitDbAccessKeys.list(projectRef),
    queryFn: ({ signal }) => getJitDbAccessConfiguration({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
