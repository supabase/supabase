import { PGlite } from '@electric-sql/pglite'
import { createClient } from '@supabase/supabase-js'
import { pipeline } from '@xenova/transformers'

import {
  MAIN_THREAD_MESSAGE,
  WORKER_MESSAGE,
  checkpoint,
  postError,
} from './local-search.worker.messages'

/**
 * @typedef {import('@xenova/transformers').Tensor} Tensor
 */

/**
 * @typedef {Object} Extractor
 * @property {(input: string) => Promise<Tensor>} extract
 */

/**
 * @type {PGlite}
 */
let db
let dbReady = false
/**
 * @type {Extractor}
 */
let extractor

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
  await db.exec('create extension if not exists vector;')
  await db.exec(`create table if not exists page (
    id bigserial primary key,
    path text,
    meta jsonb,
    type text,
    source text
  )`)
  await db.exec(`create table if not exists page_section (
    id bigserial primary key,
    page_id bigint,
    slug text,
    heading text,
    rag_ignore boolean,
    hf_embedding vector(384)
  )`)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: pages, error: pagesError } = await supabase
    .from('page')
    .select('id,path,meta,type,source')
  if (pagesError) {
    return postError(pagesError)
  }
  if (!pages) {
    return postError({ message: 'missing pages' })
  }
  try {
    await Promise.all(
      pages.map(async (page) => {
        // Yes, this looks like a SQL injection waiting to happen, but:
        // (1) Running only in individual local browsers
        // (2) For testing only
        // (3) Copying values from already validated database
        const sqlStatement = `insert into page (
          id,
          path,
          meta,
          type,
          source
        ) values (
          ${page.id},
          '${page.path}',
          '${JSON.stringify(page.meta)?.replaceAll(`'`, `''`) ?? null}',
          '${page.type}',
          '${page.source}'
        )`
        try {
          await db.exec(sqlStatement)
        } catch (error) {
          postError(error, { sql: sqlStatement })
        }
      })
    )
  } catch (error) {
    return postError(error)
  }

  const { data: pageSections, error: pageSectionsError } = await supabase
    .from('page_section')
    .select('id,page_id,slug,heading,rag_ignore,hf_embedding')
  if (pageSectionsError) {
    return postError(pageSectionsError)
  }
  if (!pageSections) {
    return postError({ message: 'missing page sections' })
  }
  try {
    await Promise.all(
      pageSections.map(async (pageSection) => {
        // Yes, this looks like a SQL injection waiting to happen, but:
        // (1) Running only in individual local browsers
        // (2) For testing only
        // (3) Copying values from already validated database
        const sqlStatement = `insert into page_section (
          id,
          page_id,
          slug,
          heading,
          rag_ignore,
          hf_embedding
        ) values (
          ${pageSection.id},
          ${pageSection.page_id},
          '${pageSection.slug}',
          '${pageSection.heading?.replaceAll(`'`, `''`) ?? null}',
          ${pageSection.rag_ignore},
          '[${JSON.parse(pageSection.hf_embedding).join(',')}]'
        )`
        try {
          await db.exec(sqlStatement)
        } catch (error) {
          postError(error, { sql: sqlStatement })
        }
      })
    )
  } catch (error) {
    postError(error)
  }

  dbReady = true
  checkpoint({
    status: 'DB_READY',
  })
}

async function getExtractor() {
  if (!extractor) {
    const pipe = await pipeline('feature-extraction', 'Supabase/gte-small')

    function extract(input) {
      return pipe(input, { pooling: 'mean', normalize: true })
    }
    extractor = { extract }
  }

  return extractor
}

async function handleSearch(query) {
  checkpoint({
    status: 'RECEIVED_SEARCH_QUERY',
  })

  if (!dbReady) {
    checkpoint({
      status: 'DB_NOT_READY',
    })
  }

  try {
    const extractor = await getExtractor()
    /**
     * @type {Array<number>}
     */
    const featureArray = (await extractor.extract(query)).tolist()[0]

    // Yes, this looks like a SQL injection waiting to happen, but:
    // (1) Running only in individual local browsers
    // (2) For testing only
    // (3) Feature vector in known format regardless of what user supplies as query
    const data = await db.exec(`
      with match as(
        select *
        from page_section
        -- The dot product is negative because of a Postgres limitation, so we negate it
        where (page_section.hf_embedding <#> '[${featureArray.join(',')}]') * -1 > 0.78	
        -- Embeddings are normalized to length 1, so
        -- cosine similarity and dot product will produce the same results.
        -- Using dot product which can be computed slightly faster.
        --
        -- For the different syntaxes, see https://github.com/pgvector/pgvector
        order by page_section.hf_embedding <#> '[${featureArray.join(',')}]'
        limit 10
      )
      select
        page.id,
        page.path,
        page.type,
        page.meta ->> 'title' as title,
        page.meta ->> 'subtitle' as subtitle,
        page.meta ->> 'description' as description,
        array_agg(match.heading) as headings,
        array_agg(match.slug) as slugs
      from page
      join match on match.page_id = page.id
      group by page.id;
    `)

    self.postMessage({
      type: WORKER_MESSAGE.SEARCH_RESULTS,
      payload: {
        matches: JSON.stringify(data),
        feature: JSON.stringify(featureArray),
      },
    })
  } catch (error) {
    postError(error)
  }
}
