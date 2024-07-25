import { postError } from './local-search.worker.messages'
import { INSERT_PAGE_SECTIONS, INSERT_PAGES } from './local-search.worker.sql'

/**
 * @typedef {import('@electric-sql/pglite').PGlite} PGlite
 */

/**
 * @typedef {import('@supabase/supabase-js').SupabaseClient} SupabaseClient
 */

/**
 * Get all rows from a table via Supabase.
 *
 * Since Supabase SDK restricts to 1000 rows per query, we need to page through
 * the table exhaustively.
 *
 * @param {SupabaseClient} supabase
 * @param {string} table - The table to query
 * @param {string} columns - Comma-separated columns, in Supabase SDK format
 * @param {string} order - The column to order the results. Needed for paging
 */
export async function pageThroughRows(supabase, table, columns, order) {
  const MAX_ROWS_PER_FETCH = 1000

  let rowsInLastFetch = 0
  let largestIndexLastFetched = 0
  const allData = []

  do {
    const { data = [], error } = await supabase
      .from(table)
      .select(columns)
      .order(order)
      .gt(order, largestIndexLastFetched)
    if (error) {
      return [error, null]
    }

    allData.push(...data)
    rowsInLastFetch = data.length
    largestIndexLastFetched =
      data.length === 0 ? largestIndexLastFetched : data[data.length - 1][order]
  } while (rowsInLastFetch === MAX_ROWS_PER_FETCH)

  return [null, allData]
}

/**
 * Copy page table data from remote database to PGlite.
 *
 * @param {SupabaseClient} supabase
 * @param {PGlite} db
 * @returns {void}
 */
export async function copyPages(supabase, db) {
  const [pagesError, pages] = await pageThroughRows(
    supabase,
    'page',
    'id,path,meta,type,source',
    'id'
  )
  if (pagesError) {
    return postError(pagesError)
  }
  if (!pages) {
    return postError({ message: `Couldn't fetch any pages from remote database.` })
  }

  await Promise.all(
    pages.map(async (page) => {
      const parameters = [page.id, page.path, page.meta, page.type, page.source]

      try {
        await db.query(INSERT_PAGES, parameters)
      } catch (error) {
        postError(error, { parameters })
      }
    })
  )
}

/**
 * Copy page sections table data from remote database to PGlite.
 *
 * @param {SupabaseClient} supabase
 * @param {PGlite} db
 * @returns {void}
 */
export async function copyPageSections(supabase, db) {
  const [pageSectionsError, pageSections] = await pageThroughRows(
    supabase,
    'page_section',
    'id,page_id,slug,heading,rag_ignore,hf_embedding',
    'id'
  )
  if (pageSectionsError) {
    return postError(pageSectionsError)
  }
  if (!pageSections) {
    return postError({ message: `Couldn't fetch any page sections from remote database.` })
  }

  await Promise.all(
    pageSections.map(async (pageSection) => {
      const parameters = [
        pageSection.id,
        pageSection.page_id,
        pageSection.slug,
        pageSection.heading,
        pageSection.rag_ignore,
        pageSection.hf_embedding,
      ]

      try {
        await db.query(INSERT_PAGE_SECTIONS, parameters)
      } catch (error) {
        postError(error, { parameters })
      }
    })
  )
}
