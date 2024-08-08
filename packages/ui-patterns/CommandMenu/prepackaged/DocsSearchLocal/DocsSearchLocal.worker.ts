import type { Results } from '@electric-sql/pglite'
import { PGlite } from '@electric-sql/pglite'
import { createClient } from '@supabase/supabase-js'

import { setupSingletonExtractor } from './DocsSearchLocal.shared.llm'
import {
  MAIN_THREAD_MESSAGE,
  WORKER_MESSAGE,
  checkpoint,
  convertError,
  postError,
} from './DocsSearchLocal.shared.messages'
import { copyPageSections, copyPages } from './DocsSearchLocal.worker.db'
import {
  CREATE_VECTOR_EXTENSION,
  CREATE_PAGE_TABLE,
  CREATE_PAGE_SECTION_TABLE,
  SEARCH_EMBEDDINGS,
} from './DocsSearchLocal.worker.sql'

const VECTOR_MATCH_THRESHOLD = 0.8

let db: PGlite
let state: 'uninitiated' | 'initiating' | 'ready' = 'uninitiated'
let readyListeners = [] as Array<() => void>

let reject: ((value: unknown) => void) | undefined
const REJECT_REASON = {
  NEW_SEARCH: 'NEW_SEARCH',
} as const

const getExtractor = setupSingletonExtractor()

self.addEventListener('connect', (connectEvent) => {
  // @ts-ignore
  const port = connectEvent.ports[0] as MessagePort
  checkpoint(port, { status: 'CONNECTED' })

  port.addEventListener('message', async (event) => {
    switch (event.data.type) {
      case MAIN_THREAD_MESSAGE.INIT:
        const { supabaseUrl, supabaseAnonKey } = event.data.payload
        if (state === 'uninitiated') {
          return init(port, supabaseUrl, supabaseAnonKey)
        } else if (state === 'initiating') {
          readyListeners.push(() => {
            alreadyReady(port)
          })
        }
        return alreadyReady(port)
      case MAIN_THREAD_MESSAGE.SEARCH:
        const { query } = event.data.payload
        return handleSearch(port, query)
      case MAIN_THREAD_MESSAGE.ABORT_SEARCH:
        return abortSearch()
    }
  })

  port.start()
})

function alreadyReady(port: MessagePort) {
  checkpoint(port, { status: 'READY' })
}

async function init(port: MessagePort, supabaseUrl: string, supabaseAnonKey: string) {
  state = 'initiating'

  try {
    db = new PGlite({
      extensions: {
        vector: new URL(
          '../../../../../node_modules/@electric-sql/pglite/dist/vector.tar.gz',
          import.meta.url
        ),
      },
    })
    await db.exec(CREATE_VECTOR_EXTENSION)
    await db.exec(CREATE_PAGE_TABLE)
    await db.exec(CREATE_PAGE_SECTION_TABLE)

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    // Preload the extraction pipeline before signaling that the worker is ready.
    // This allows the search client to fall back to remote search until local
    // search is guaranteed to be quick.
    const eagerPipelineInitiation = getExtractor()
    await Promise.all([
      copyPages(port, supabase, db),
      copyPageSections(port, supabase, db),
      eagerPipelineInitiation,
    ])
  } catch (error) {
    return postError(port, convertError(error))
  }

  state = 'ready'
  checkpoint(port, {
    status: 'READY',
  })
  while (readyListeners.length > 0) {
    readyListeners.pop()?.()
  }
}

async function handleSearch(port: MessagePort, query: string) {
  if (state !== 'ready') {
    return postError(
      port,
      {
        message: WORKER_MESSAGE.NOT_READY,
      },
      { hint: 'Fall back to calling search functions on remote database' }
    )
  }

  try {
    const extractor = await getExtractor()
    const featureArray = (await extractor.extract(query)).tolist()[0] as Array<number>

    // Abort currently running search
    abortSearch()

    new Promise(async (resolve, rejectThis) => {
      reject = rejectThis

      try {
        const results = await db.query(SEARCH_EMBEDDINGS, [
          `[${featureArray.join(',')}]`,
          VECTOR_MATCH_THRESHOLD,
          query,
        ])
        resolve(results)
      } catch (error) {
        rejectThis(error)
      }
    })
      .then((data) => {
        port.postMessage({
          type: WORKER_MESSAGE.SEARCH_RESULTS,
          payload: {
            matches: JSON.stringify((data as Results<unknown>).rows),
          },
        })
      })
      .catch((error) => {
        if (error === REJECT_REASON.NEW_SEARCH) {
          /* Silently ignore */
        } else {
          postError(port, convertError(error))
        }
      })
  } catch (error) {
    postError(port, convertError(error))
  }
}

/**
 * Abort a currently running search.
 */
function abortSearch() {
  reject?.(REJECT_REASON.NEW_SEARCH)
}
