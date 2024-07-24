'use client'

import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { MAIN_THREAD_MESSAGE, WORKER_MESSAGE } from './local-search.worker.messages'

const SearchWorkerContext = createContext<Worker>(undefined)

export function SearchWorkerProvider({ children }: PropsWithChildren) {
  const [worker, setWorker] = useState<Worker>()

  useEffect(() => {
    const worker = new Worker(new URL('./local-search.worker.js', import.meta.url), {
      type: 'module',
    })
    worker.onerror = (errorEvent) => {
      console.error(`UNCAUGHT WORKER ERROR:\n\n${errorEvent}`)
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

  return <SearchWorkerContext.Provider value={worker}>{children}</SearchWorkerContext.Provider>
}

export function useLocalSearch() {
  const worker = useContext(SearchWorkerContext)
  const [searchResults, setSearchResults] = useState<Array<any>>([])

  const search = useCallback(
    (query: string) => {
      if (!worker) {
        console.error('Search ran before worker was initiated')
      }

      worker.postMessage({
        type: MAIN_THREAD_MESSAGE.SEARCH,
        payload: { query },
      })
    },
    [worker]
  )

  useEffect(() => {
    if (!worker) return

    function handleSearchResults(event) {
      if (event.data.type !== WORKER_MESSAGE.SEARCH_RESULTS) return
      const searchResults = JSON.parse(event.data.payload.matches)[0].rows
      setSearchResults(searchResults)
    }

    const currentWorker = worker
    currentWorker.addEventListener('message', handleSearchResults)
    return () => currentWorker.removeEventListener('message', handleSearchResults)
  }, [worker])

  const api = useMemo(() => ({ search, searchResults }), [search, searchResults])

  return api
}
