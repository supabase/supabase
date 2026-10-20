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
type LiveStream = { completedUntil: number; window?: LiveWindow }
type LiveLogs = {
  rows: LogRow[]
  forward: LiveStream
  sweep: LiveStream
}

const isCatchingUp = (data?: LiveLogs) => !!(data?.forward.window || data?.sweep.window)

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
  const turns = useRef(new Map<string, boolean>())
  const getTurn = useCallback((scope: string) => turns.current.get(scope) ?? false, [])
  const rotateTurn = useCallback((scope: string, isSweep: boolean) => {
    turns.current.set(scope, !isSweep)
  }, [])
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
      const seed = cached?.forward.completedUntil ?? getSeed()
      if (seed === undefined) throw new Error('Logs must load before live mode starts')
      const forward = cached?.forward ?? { completedUntil: seed }
      const sweep = cached?.sweep ?? { completedUntil: seed }
      const now = Date.now()
      const hasForwardWork = !!forward.window || forward.completedUntil < now
      const hasSweepWork = !!sweep.window || sweep.completedUntil + 30_000 <= now
      const scope = hashKey(queryKey)
      const isSweep = hasSweepWork && (getTurn(scope) || !hasForwardWork)
      const stream = isSweep ? sweep : forward
      const overlap = isSweep ? 2 * 60 * 1000 : 0
      const start = stream.window?.start ?? stream.completedUntil - overlap
      const end = stream.window?.end ?? now
      const row = stream.window?.row
      const page = await getUnifiedLogs(
        {
          projectRef,
          search: { ...search, date: [new Date(start - 1), new Date(end)] },
          useOtel,
          pageParam: row ? { cursor: end, direction: 'next', row } : null,
        },
        signal
      ).finally(() => rotateTurn(scope, isSweep))
      const rows = mergeUnifiedLogs([...page.data, ...(cached?.rows ?? [])]).filter(
        (entry) => entry.date.getTime() >= Date.now() - 60 * 60 * 1000
      )
      const window =
        page.data.length === 50 && page.nextRow ? { start, end, row: page.nextRow } : undefined
      signal.throwIfAborted()
      const updated = { completedUntil: window ? stream.completedUntil : end, window }
      return {
        rows,
        forward: isSweep ? forward : updated,
        sweep: isSweep ? updated : sweep,
      }
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
    return { isCatchingUp: !result.error && isCatchingUp(result.data) }
  }, [canPoll, refetch])
  return {
    data: query.data,
    error: query.error,
    isError: query.isError,
    onPoll,
    isCatchingUp: isCatchingUp(query.data),
  }
}
