import { useCallback, useMemo, useRef, useState } from 'react'

import { getNewLiveLogBatch, LiveLogBatch, orderLiveLogRows } from './LiveLogBatches.utils'

type LiveLogSession = {
  scope: string
  generation: symbol
  batches: LiveLogBatch[]
  baselineIds: string[]
}

const createSession = (scope: string): LiveLogSession => ({
  scope,
  generation: Symbol(),
  batches: [],
  baselineIds: [],
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
  fetchPreviousPage: () => Promise<{
    isError: boolean
    data?: { pages: { data: T[] }[] }
  }>
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

  const resetLiveBatches = useCallback(() => {
    const nextSession = createSession(latest.current.session.scope)
    latest.current = { ...latest.current, session: nextSession }
    setSession(nextSession)
  }, [])

  const fetchLiveLogs = useCallback(async () => {
    const previous = latest.current
    if (previous.isPlaceholderData) return

    const response = await previous.fetchPreviousPage()
    if (response.isError || previous.session.generation !== latest.current.session.generation) {
      return response
    }

    const page = response.data?.pages[0]
    const hasCompletedLivePoll =
      previous.firstPage !== undefined && page !== undefined && page !== previous.firstPage
    if (hasCompletedLivePoll) {
      const batch = getNewLiveLogBatch(page.data, previous.rows, Date.now())
      setSession((current) => {
        if (current.generation !== previous.session.generation) return current
        const batchedIds = new Set(current.batches.flatMap((entry) => entry.ids))
        return {
          ...current,
          batches: batch ? [batch, ...current.batches] : current.batches,
          baselineIds: previous.rows.map((row) => row.id).filter((id) => !batchedIds.has(id)),
        }
      })
    }
    await previous.refetchCounts()
    return response
  }, [])

  return { rows: orderedRows, batches: currentSession.batches, fetchLiveLogs, resetLiveBatches }
}
