import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  RoleTestResult,
  TestRole,
  WorkerRequest,
  WorkerResponse,
} from './rls-test-worker'

export type RLSTestStatus = 'idle' | 'initializing' | 'loading_schema' | 'loading_data' | 'testing' | 'done' | 'error'

export function useRLSPolicyTest() {
  const workerRef = useRef<Worker | null>(null)
  const resolveRef = useRef<((msg: WorkerResponse) => void) | null>(null)

  const [status, setStatus] = useState<RLSTestStatus>('idle')
  const [results, setResults] = useState<RoleTestResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dataRowCount, setDataRowCount] = useState(0)

  const sendMessage = useCallback((msg: WorkerRequest): Promise<WorkerResponse> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'))
        return
      }
      resolveRef.current = resolve
      workerRef.current.postMessage(msg)
    })
  }, [])

  const initWorker = useCallback(async () => {
    // Dispose previous worker if any
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    setStatus('initializing')
    setError(null)
    setResults([])
    setDataRowCount(0)

    const worker = new Worker(
      new URL('./rls-test-worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'error') {
        setError(msg.message)
        setStatus('error')
        resolveRef.current?.(msg)
        resolveRef.current = null
        return
      }
      resolveRef.current?.(msg)
      resolveRef.current = null
    }

    worker.onerror = (e) => {
      setError(e.message)
      setStatus('error')
    }

    workerRef.current = worker

    await sendMessage({ type: 'init' })
    return worker
  }, [sendMessage])

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

        // 1. Init fresh PGlite
        await initWorker()

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
    [initWorker, sendMessage]
  )

  const dispose = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'dispose' })
      workerRef.current.terminate()
      workerRef.current = null
    }
    setStatus('idle')
    setResults([])
    setError(null)
    setDataRowCount(0)
  }, [])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  return {
    status,
    results,
    error,
    dataRowCount,
    runTest,
    dispose,
  }
}
