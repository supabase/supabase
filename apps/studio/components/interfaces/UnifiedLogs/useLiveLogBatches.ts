import { useCallback, useRef, useState } from 'react'

export function useLiveLogBatches({
  scope,
  isPlaceholderData,
  fetchPreviousPage,
  refetchCounts,
}: {
  scope: string
  isPlaceholderData: boolean
  fetchPreviousPage: () => Promise<{ isError: boolean }>
  refetchCounts: () => Promise<{ isError: boolean }>
}) {
  const [session, setSession] = useState(() => ({ scope, generation: Symbol() }))
  let currentSession = session
  if (session.scope !== scope) {
    currentSession = { scope, generation: Symbol() }
    setSession(currentSession)
  }

  const latest = useRef({
    session: currentSession,
    isPlaceholderData,
    fetchPreviousPage,
    refetchCounts,
  })
  latest.current = { session: currentSession, isPlaceholderData, fetchPreviousPage, refetchCounts }

  const fetchLiveLogs = useCallback(async () => {
    const previous = latest.current
    if (previous.isPlaceholderData) return
    const response = await previous.fetchPreviousPage()
    if (response.isError || previous.session.generation !== latest.current.session.generation) {
      return response
    }
    await previous.refetchCounts()
    return response
  }, [])

  return { fetchLiveLogs }
}
