import { useCallback, useMemo, useRef, useState } from 'react'

import { getNewLiveLogBatch, LiveLogBatch, orderLiveLogRows } from './LiveLogBatches.utils'

type LiveLogSession = {
  scope: string
  generation: symbol
  batches: LiveLogBatch[]
  baselineIds: string[]
  unreadCount: number
}

type FetchLogs<T> = () => Promise<{
  isError: boolean
  data?: { pages: { data: T[] }[] }
}>

const createSession = (scope: string): LiveLogSession => ({
  scope,
  generation: Symbol(),
  batches: [],
  baselineIds: [],
  unreadCount: 0,
})

export function useLiveLogBatches<T extends { id: string }>({
  scope,
  rows,
  firstPage,
  isPlaceholderData,
  fetchPreviousPage,
  refetchCounts,
}: {
  scope: string
  rows: T[]
  firstPage: { data: T[] } | undefined
  isPlaceholderData: boolean
  fetchPreviousPage: FetchLogs<T>
  refetchCounts: () => Promise<{ isError: boolean }>
}) {
  const [session, setSession] = useState(() => createSession(scope))
  let currentSession = session
  if (session.scope !== scope) {
    currentSession = createSession(scope)
    setSession(currentSession)
  }

  const orderedRows = useMemo(
    () => orderLiveLogRows(rows, currentSession.batches, currentSession.baselineIds),
    [rows, currentSession.batches, currentSession.baselineIds]
  )
  const latest = useRef({
    session: currentSession,
    rows: orderedRows,
    firstPage,
    isPlaceholderData,
    fetchPreviousPage,
    refetchCounts,
  })
  latest.current = {
    session: currentSession,
    rows: orderedRows,
    firstPage,
    isPlaceholderData,
    fetchPreviousPage,
    refetchCounts,
  }

  const acknowledgeLiveLogs = useCallback(() => {
    setSession((current) => (current.unreadCount === 0 ? current : { ...current, unreadCount: 0 }))
  }, [])

  const fetchLiveLogs = useCallback(async () => {
    const previous = latest.current
    if (previous.isPlaceholderData) return

    const response = await previous.fetchPreviousPage()
    if (response.isError || previous.session.generation !== latest.current.session.generation) {
      return response
    }

    const page = response.data?.pages[0]
    const hasCompletedRefresh =
      previous.firstPage !== undefined && page !== undefined && page !== previous.firstPage
    if (hasCompletedRefresh) {
      const batch = getNewLiveLogBatch(page.data, previous.rows, Date.now())
      setSession((current) => {
        if (current.generation !== previous.session.generation) return current
        const batchedIds = new Set(current.batches.flatMap((entry) => entry.ids))
        const baselineIds = new Set([...current.baselineIds, ...previous.rows.map((row) => row.id)])
        const newIds = batch?.ids.filter((id) => !batchedIds.has(id) && !baselineIds.has(id)) ?? []
        return {
          ...current,
          batches:
            batch && newIds.length > 0
              ? [{ ...batch, ids: newIds }, ...current.batches]
              : current.batches,
          baselineIds: [...baselineIds].filter((id) => !batchedIds.has(id)),
          unreadCount: current.unreadCount + newIds.length,
        }
      })
    }
    await previous.refetchCounts()
    return response
  }, [])

  return {
    rows: orderedRows,
    batches: currentSession.batches,
    unreadCount: currentSession.unreadCount,
    sessionKey: currentSession.generation,
    acknowledgeLiveLogs,
    fetchLiveLogs,
  }
}
