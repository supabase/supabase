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

// Thrown instead of returning a sentinel object so that `data` stays a single
// clean shape. Consumers can read `isUnavailable` and `unavailableReason`
// directly from the hook rather than doing 'in' type-narrowing on `data`.
class JitUnavailableError extends Error {
  readonly isUnavailabilityError = true
  constructor(readonly unavailableReason: JitDbAccessUnavailableReason) {
    super('Temporary access is unavailable for this project')
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
    throw new JitUnavailableError(
      getUnavailableReason('unavailableReason' in data ? data.unavailableReason : undefined)
    )
  }

  return data
}

type JitDbAccessData = Awaited<ReturnType<typeof getJitDbAccessConfiguration>>

export const useJitDbAccessQuery = <TData = JitDbAccessData>(
  { projectRef }: JitDbAccessVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<JitDbAccessData, ResponseError, TData> = {}
) => {
  const query = useQuery<JitDbAccessData, ResponseError, TData>({
    queryKey: jitDbAccessKeys.list(projectRef),
    queryFn: ({ signal }) => getJitDbAccessConfiguration({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

  const unavailabilityError =
    query.isError && (query.error as unknown as Partial<JitUnavailableError>)?.isUnavailabilityError
      ? (query.error as unknown as JitUnavailableError)
      : null

  return {
    ...query,
    isUnavailable: unavailabilityError !== null,
    unavailableReason: unavailabilityError?.unavailableReason ?? 'temporarily_unavailable',
  }
}
