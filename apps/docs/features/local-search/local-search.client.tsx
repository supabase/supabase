'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { MAIN_THREAD_MESSAGE, WORKER_MESSAGE } from './local-search.worker.messages'

interface WorkerContext {
  worker: Worker
  dbReady: boolean
}

const SearchWorkerContext = createContext<WorkerContext>(undefined)

export function SearchWorkerProvider({ children }: PropsWithChildren) {
  const [worker, setWorker] = useState<Worker>()
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    const worker = new Worker(new URL('./local-search.worker.js', import.meta.url), {
      type: 'module',
    })
    worker.onerror = (errorEvent) => {
      console.error(`UNCAUGHT WORKER ERROR:\n\n${errorEvent.message}`)
    }

    worker.postMessage({
      type: MAIN_THREAD_MESSAGE.INIT,
      payload: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    })

    setWorker(worker)

    function logWorkerMessage(event) {
      if (event.data.type === WORKER_MESSAGE.CHECKPOINT) {
        if (event.data.payload?.status === 'DB_READY') {
          setDbReady(true)
        }
        console.log(
          `WORKER EVENT: ${event.data.type}\n\n${JSON.stringify(event.data.payload ?? {}, null, 2)}`
        )
      } else if (event.data.type === WORKER_MESSAGE.ERROR) {
        console.error(`WORKER ERROR:\n\n${JSON.stringify(event.data.payload ?? {}, null, 2)}`)
      }
    }

    worker.addEventListener('message', logWorkerMessage)
    return () => {
      worker.removeEventListener('message', logWorkerMessage)
      worker.terminate()
    }
  }, [])

  const api = useMemo(() => ({ worker, dbReady }), [worker, dbReady])

  return <SearchWorkerContext.Provider value={api}>{children}</SearchWorkerContext.Provider>
}

export function useLocalSearch() {
  const supabase = useSupabaseClient()
  const { worker, dbReady } = useContext(SearchWorkerContext)
  const [searchResults, setSearchResults] = useState<Array<any>>([])

  const search = useCallback(
    (query: string) => {
      if (!worker) {
        console.error('Search ran before worker was initiated')
      }

      if (dbReady) {
        return worker.postMessage({
          type: MAIN_THREAD_MESSAGE.SEARCH,
          payload: { query },
        })
      }

      // Fall back to regular FTS
      supabase.rpc('docs_search_fts', { query }).then(({ data, error }) => {
        if (error) {
          return console.error(error)
        }

        setSearchResults(data)
      })
    },
    [worker, dbReady, supabase]
  )

  useEffect(() => {
    if (!worker) return

    function handleSearchResults(event) {
      if (event.data.type !== WORKER_MESSAGE.SEARCH_RESULTS) return
      const searchResults = JSON.parse(event.data.payload.matches)
      setSearchResults(searchResults)
    }

    const currentWorker = worker
    currentWorker.addEventListener('message', handleSearchResults)
    return () => currentWorker.removeEventListener('message', handleSearchResults)
  }, [worker])

  const api = useMemo(() => ({ search, searchResults }), [search, searchResults])

  return api
}
