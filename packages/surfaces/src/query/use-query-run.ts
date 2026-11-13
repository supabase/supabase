import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { errorMessage } from '../common'
import type { LogWindow, QuerySource } from '../contract'
import type { Entity, QueryResult, RunQuery } from './query-model'

const DEFAULT_PAGE_SIZE = 50

interface UseQueryRunOptions {
  onRun: RunQuery
  entity?: Entity
  source: QuerySource
  logWindow?: LogWindow
  initialResult?: QueryResult
  /** Runs once on mount. Only an untouched generated table query should. */
  shouldAutoRun: boolean
  /** Reads the current draft at run time, so agent edits made this tick are included. */
  getSql: () => string
  onStart?: () => void
}

/** Runs a query tab's SQL one execution at a time and keeps the latest result. */
export function useQueryRun({
  onRun,
  entity,
  source,
  logWindow,
  initialResult,
  shouldAutoRun,
  getSql,
  onStart,
}: UseQueryRunOptions) {
  const [result, setResult] = useState<QueryResult | undefined>(initialResult)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(shouldAutoRun)
  const [elapsedMs, setElapsedMs] = useState<number>()
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const lock = useRef(false)
  const isMounted = useRef(true)
  const hasAutoRun = useRef(false)

  async function run(offset = 0, rowLimit = limit) {
    const sql = getSql()
    if (!sql.trim() || lock.current) return
    lock.current = true
    setIsBusy(true)
    setError('')
    onStart?.()
    const start = performance.now()
    try {
      const next = await onRun({ sql, entity, offset, limit: rowLimit, source, logWindow })
      if (isMounted.current) {
        setResult(next)
        setLimit(rowLimit)
      }
    } catch (e) {
      if (isMounted.current) {
        setError(errorMessage(e))
        setResult(undefined)
      }
    } finally {
      if (isMounted.current) {
        setElapsedMs(Math.round(performance.now() - start))
        setIsBusy(false)
      }
      lock.current = false
    }
  }

  // Tab switching keeps the editor mounted, so this never reruns an edited draft.
  const runInitialQuery = useEffectEvent(() => {
    if (!shouldAutoRun || hasAutoRun.current) return
    hasAutoRun.current = true
    void run()
  })
  useEffect(() => {
    isMounted.current = true
    runInitialQuery()
    return () => {
      isMounted.current = false
    }
  }, [])

  return {
    result,
    error,
    isBusy,
    elapsedMs,
    limit,
    run,
    /** True while an execution is in flight, read synchronously by agent tools. */
    isRunning: () => lock.current,
  }
}
