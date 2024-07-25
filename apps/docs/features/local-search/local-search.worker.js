import { PGlite } from '@electric-sql/pglite'
import { createClient } from '@supabase/supabase-js'

import { setupSingletonExtractor } from './local-search.shared.llm.mjs'
import { copyPageSections, copyPages } from './local-search.worker.db'
import {
  MAIN_THREAD_MESSAGE,
  WORKER_MESSAGE,
  checkpoint,
  postError,
} from './local-search.worker.messages'
import {
  CREATE_VECTOR_EXTENSION,
  CREATE_PAGE_TABLE,
  CREATE_PAGE_SECTION_TABLE,
  SEARCH_EMBEDDINGS,
} from './local-search.worker.sql'

/**
 * @typedef {import('@xenova/transformers').Tensor} Tensor
 */

/**
 * @typedef {import('./local-search.shared.llm.mjs').Extractor} Extractor
 */

/**
 * @type {PGlite}
 */
let db
let dbReady = false

const getExtractor = setupSingletonExtractor()

self.addEventListener('message', async (event) => {
  switch (event.data.type) {
    case MAIN_THREAD_MESSAGE.INIT:
      const { supabaseUrl, supabaseAnonKey } = event.data.payload
      return initDb(supabaseUrl, supabaseAnonKey)
    case MAIN_THREAD_MESSAGE.SEARCH:
      const { query } = event.data.payload
      return handleSearch(query)
  }
})

async function initDb(supabaseUrl, supabaseAnonKey) {
  db = new PGlite({
    extensions: {
      vector: new URL(
        '../../../../node_modules/@electric-sql/pglite/dist/vector.tar.gz',
        import.meta.url
      ),
    },
  })
  await db.exec(CREATE_VECTOR_EXTENSION)
  await db.exec(CREATE_PAGE_TABLE)
  await db.exec(CREATE_PAGE_SECTION_TABLE)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  await Promise.all([(copyPages(supabase, db), copyPageSections(supabase, db))])

  dbReady = true
  checkpoint({
    status: 'DB_READY',
  })
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} query
 * @returns {void}
 */
async function handleSearch(query) {
  if (!dbReady) {
    return postError(
      {
        message: 'DB_NOT_READY',
      },
      { hint: 'Fall back to calling search functions on remote database' }
    )
  }

  try {
    const extractor = await getExtractor()
    /**
     * @type {Array<number>}
     */
    const featureArray = (await extractor.extract(query)).tolist()[0]

    const data = await db.query(SEARCH_EMBEDDINGS, [`[${featureArray.join(',')}]`, 0.8])

    self.postMessage({
      type: WORKER_MESSAGE.SEARCH_RESULTS,
      payload: {
        matches: JSON.stringify(data.rows),
      },
    })
  } catch (error) {
    postError(error)
  }
}
