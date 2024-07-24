'use client'

import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const SearchWorkerContext = createContext<Worker>(undefined)

export function SearchWorkerProvider({ children }: PropsWithChildren) {
  const [worker, setWorker] = useState<Worker>()

  useEffect(() => {
    const worker = new Worker(new URL('./local-search.worker.js', import.meta.url), {
      type: 'module',
    })
    setWorker(worker)
    setTimeout(() => {
      worker.postMessage({
        type: 'INIT',
        payload: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      })
    })

    function alertWorkerMessages(event) {
      if (event.data.type === 'CHECKPOINT') {
        console.log(
          `WORKER EVENT: ${event.data.type}\n\n${JSON.stringify(event.data.payload ?? {}, null, 2)}`
        )
      } else if (event.data.type === 'ERROR') {
        console.error(`WORKER ERROR:\n\n${JSON.stringify(event.data.payload ?? {}, null, 2)}`)
      }
    }

    worker.addEventListener('message', alertWorkerMessages)
    return () => {
      worker.removeEventListener('message', alertWorkerMessages)
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

      console.log('POSTING SEARCH MESSAGE:', query)
      worker.postMessage({
        type: 'SEARCH',
        payload: { query },
      })
    },
    [worker]
  )

  useEffect(() => {
    if (!worker) return

    function handleSearchResults(event) {
      if (event.data.type !== 'SEARCH_RESULTS') return
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
