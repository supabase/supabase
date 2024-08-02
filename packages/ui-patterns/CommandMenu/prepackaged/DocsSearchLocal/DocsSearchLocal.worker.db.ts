import type { PGlite } from '@electric-sql/pglite'
import type { SupabaseClient } from '@supabase/auth-helpers-react'

import type { Database } from 'common'

import { checkpoint, convertError, postError } from './DocsSearchLocal.shared.messages'
import { INSERT_PAGE_SECTIONS, INSERT_PAGES } from './DocsSearchLocal.worker.sql'

/**
 * Get all rows from a table via Supabase.
 *
 * Since Supabase SDK restricts to 1000 rows per query, we need to page through
 * the table exhaustively.
 *
 * @param table - The table to query
 * @param columns - Comma-separated columns, in Supabase SDK format
 * @param order - The column to order the results. Needed for paging
 */
export async function pageThroughRows<Table extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: Table,
  columns: string,
  order: string
) {
  const MAX_ROWS_PER_FETCH = 1000

  let rowsInLastFetch = 0
  let largestIndexLastFetched = 0
  const allData = []

  do {
    let { data, error } = await supabase
      .from<Table, Database['public']['Tables'][Table]>(table)
      .select(columns)
      .order(order)
      .gt(order, largestIndexLastFetched)
    if (error) {
      return [error, null] as const
    }

    data ??= []
    allData.push(...data)
    rowsInLastFetch = data.length
    largestIndexLastFetched =
      // @ts-ignore
      data.length === 0 ? largestIndexLastFetched : data[data.length - 1][order]
  } while (rowsInLastFetch === MAX_ROWS_PER_FETCH)

  return [null, allData as unknown as Array<Database['public']['Tables'][Table]['Row']>] as const
}

export async function copyPages(port: MessagePort, supabase: SupabaseClient, db: PGlite) {
  const [pagesError, pages] = await pageThroughRows<'page'>(
    supabase,
    'page',
    'id, path, meta, type, source, content',
    'id'
  )
  if (pagesError) {
    return postError(port, pagesError)
  }
  if (!pages) {
    return postError(port, { message: `Couldn't fetch any pages from remote database.` })
  }

  await Promise.all(
    pages.map(async (page) => {
      const parameters = [page.id, page.path, page.meta, page.type, page.source, page.content]

      try {
        await db.query(INSERT_PAGES, parameters)
      } catch (error) {
        postError(port, convertError(error), { parameters })
      }
    })
  )
}

export async function copyPageSections(port: MessagePort, supabase: SupabaseClient, db: PGlite) {
  const [pageSectionsError, pageSections] = await pageThroughRows<'page_section'>(
    supabase,
    'page_section',
    'id, page_id, slug, heading, rag_ignore, hf_embedding',
    'id'
  )
  if (pageSectionsError) {
    return postError(port, pageSectionsError)
  }
  if (!pageSections) {
    return postError(port, { message: `Couldn't fetch any page sections from remote database.` })
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
        postError(port, convertError(error), { parameters })
      }
    })
  )
}
