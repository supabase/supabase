import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  RoleTestResult,
  TestRole,
  WorkerRequest,
  WorkerResponse,
} from './rls-test-worker'

export type RLSTestStatus = 'idle' | 'initializing' | 'loading_schema' | 'loading_data' | 'testing' | 'done' | 'error'

const WORKER_TIMEOUT_MS = 30_000

export function useRLSPolicyTest() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<{
    resolve: (msg: WorkerResponse) => void
    reject: (err: Error) => void
    timer: ReturnType<typeof setTimeout>
  } | null>(null)

  const [status, setStatus] = useState<RLSTestStatus>('idle')
  const [results, setResults] = useState<RoleTestResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dataRowCount, setDataRowCount] = useState(0)

  const clearPending = useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer)
      pendingRef.current = null
    }
  }, [])

  const sendMessage = useCallback(
    (msg: WorkerRequest, timeoutMs = WORKER_TIMEOUT_MS): Promise<WorkerResponse> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not available'))
          return
        }

        // Reject any pending promise before overwriting
        if (pendingRef.current) {
          clearTimeout(pendingRef.current.timer)
          pendingRef.current.reject(new Error('Superseded by new message'))
        }

        const timer = setTimeout(() => {
          pendingRef.current = null
          reject(new Error(`Worker operation timed out after ${timeoutMs / 1000}s`))
        }, timeoutMs)

        pendingRef.current = { resolve, reject, timer }
        workerRef.current.postMessage(msg)
      })
    },
    []
  )

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current

    const worker = new Worker(
      new URL('./rls-test-worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      const pending = pendingRef.current
      if (!pending) return

      clearTimeout(pending.timer)
      pendingRef.current = null

      if (msg.type === 'error') {
        setError(msg.message)
        setStatus('error')
      }
      pending.resolve(msg)
    }

    worker.onerror = (e) => {
      const pending = pendingRef.current
      if (pending) {
        clearTimeout(pending.timer)
        pendingRef.current = null
        pending.reject(new Error(e.message))
      }
      setError(e.message)
      setStatus('error')
    }

    workerRef.current = worker
    return worker
  }, [])

  const runTest = useCallback(
    async ({
      schemaSql,
      dataSql,
      policySql,
      tableName,
      schema,
      roles,
    }: {
      schemaSql: string
      dataSql: string
      policySql: string
      tableName: string
      schema: string
      roles: TestRole[]
    }) => {
      try {
        setError(null)
        setResults([])
        setDataRowCount(0)

        // 1. Init fresh PGlite (reuses worker, creates new PGlite instance)
        setStatus('initializing')
        ensureWorker()
        const initRes = await sendMessage({ type: 'init' })
        if (initRes.type === 'error') throw new Error(initRes.message)

        // 2. Load schema
        setStatus('loading_schema')
        const schemaRes = await sendMessage({ type: 'load_schema', sql: schemaSql })
        if (schemaRes.type === 'error') throw new Error(schemaRes.message)

        // 3. Load data
        setStatus('loading_data')
        const dataRes = await sendMessage({ type: 'load_data', sql: dataSql })
        if (dataRes.type === 'error') throw new Error(dataRes.message)
        if (dataRes.type === 'data_loaded') setDataRowCount(dataRes.rowCount)

        // 4. Test policy
        setStatus('testing')
        const testRes = await sendMessage({
          type: 'test_policy',
          tableName,
          schema,
          policySql,
          roles,
        })

        if (testRes.type === 'error') throw new Error(testRes.message)
        if (testRes.type === 'test_result') {
          setResults(testRes.results)
        }

        setStatus('done')
      } catch (err: any) {
        setError(err.message ?? String(err))
        setStatus('error')
      }
    },
    [ensureWorker, sendMessage]
  )

  const dispose = useCallback(() => {
    clearPending()
    if (workerRef.current) {
      // Send dispose to let PGlite close, then terminate
      workerRef.current.postMessage({ type: 'dispose' } satisfies WorkerRequest)
      // Give it a moment to close cleanly, then force-terminate
      const w = workerRef.current
      setTimeout(() => w.terminate(), 500)
      workerRef.current = null
    }
    setStatus('idle')
    setResults([])
    setError(null)
    setDataRowCount(0)
  }, [clearPending])

  useEffect(() => {
    return () => {
      clearPending()
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'dispose' } satisfies WorkerRequest)
        const w = workerRef.current
        setTimeout(() => w.terminate(), 500)
        workerRef.current = null
      }
    }
  }, [clearPending])

  return {
    status,
    results,
    error,
    dataRowCount,
    runTest,
    dispose,
  }
}
