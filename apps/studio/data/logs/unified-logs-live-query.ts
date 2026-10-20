import { hashKey, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import { logsKeys } from './keys'
import {
  getUnifiedLogs,
  useUnifiedLogsBackend,
  type UnifiedLogsData,
  type UnifiedLogsVariables,
} from './unified-logs-infinite-query'
import { deduplicateUnifiedLogs } from './unified-logs.utils'

type LogRow = UnifiedLogsData['data'][number]
type LiveWindow = { start: number; end: number; row: NonNullable<UnifiedLogsData['nextRow']> }
type LiveLogs = { rows: LogRow[]; completedUntil: number; window?: LiveWindow }

const timestampNanos = (row: LogRow) => {
  const timestamp = String(row.timestamp)
  const fractional = timestamp.match(/\.(\d+)/)?.[1] ?? ''
  const remainder = /[T-]/.test(timestamp)
    ? Number(fractional.padEnd(9, '0').slice(3, 9))
    : (Number(row.timestamp) % 1000) * 1000
  return BigInt(row.date.getTime()) * 1_000_000n + BigInt(remainder)
}

export const mergeUnifiedLogs = (rows: LogRow[]) =>
  deduplicateUnifiedLogs(rows).sort((a, b) => {
    const timestampA = timestampNanos(a)
    const timestampB = timestampNanos(b)
    if (timestampA !== timestampB) return timestampA > timestampB ? -1 : 1
    if (a.id === b.id) return 0
    return a.id > b.id ? -1 : 1
  })

export const useUnifiedLogsLiveQuery = ({
  projectRef,
  search,
  isLive,
  seed,
}: UnifiedLogsVariables & { isLive: boolean; seed?: number }) => {
  const queryClient = useQueryClient()
  const seedRef = useRef(seed)
  useLayoutEffect(() => {
    seedRef.current = seed
  }, [seed])
  const getSeed = useCallback(() => seedRef.current, [])
  const useOtel = useUnifiedLogsBackend()
  const queryKey = logsKeys.unifiedLogsLive(projectRef, search, useOtel)
  const queryHash = hashKey(queryKey)
  const query = useQuery({
    queryKey,
    enabled: false,
    retry: false,
    queryFn: async ({ signal, queryKey }): Promise<LiveLogs> => {
      const cached = queryClient.getQueryData<LiveLogs>(queryKey)
      const completedUntil = cached?.completedUntil ?? getSeed()
      if (completedUntil === undefined) throw new Error('Logs must load before live mode starts')
      const start = cached?.window?.start ?? completedUntil - 2 * 60 * 1000
      const end = cached?.window?.end ?? Date.now()
      const row = cached?.window?.row
      const page = await getUnifiedLogs(
        {
          projectRef,
          search: { ...search, date: [new Date(start), new Date(end)] },
          useOtel,
          pageParam: row ? { cursor: end, direction: 'next', row } : null,
        },
        signal
      )
      const rows = mergeUnifiedLogs([...page.data, ...(cached?.rows ?? [])]).filter(
        (entry) => entry.date.getTime() >= Date.now() - 60 * 60 * 1000
      )
      const window =
        page.data.length === 50 && page.nextRow ? { start, end, row: page.nextRow } : undefined
      signal.throwIfAborted()
      return { rows, completedUntil: window ? completedUntil : end, window }
    },
  })
  const canPoll =
    isLive &&
    !search.date &&
    projectRef !== undefined &&
    (seed !== undefined || query.data !== undefined)
  useEffect(() => {
    const cancel = () =>
      queryClient.cancelQueries({ predicate: (query) => query.queryHash === queryHash })
    if (!canPoll) cancel()
    return () => {
      cancel()
    }
  }, [canPoll, queryClient, queryHash])
  const { refetch } = query
  const onPoll = useCallback(async () => {
    if (!canPoll) return { isCatchingUp: false }
    const result = await refetch({ cancelRefetch: false })
    return { isCatchingUp: !result.error && result.data?.window !== undefined }
  }, [canPoll, refetch])
  return {
    data: query.data,
    error: query.error,
    isError: query.isError,
    onPoll,
    isCatchingUp: query.data?.window !== undefined,
  }
}
