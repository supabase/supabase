import type { ContentBase } from './content-query'
import { isLogsViewContent, parseLogSqlSnippet } from './log-content-schema'
import { get, handleError } from '@/data/fetchers'

type LogContentVariables = {
  projectRef?: string
  name?: string
  visibility?: ContentBase['visibility']
  favorite?: boolean
  sort?: 'name' | 'inserted_at'
  limit?: number
  cursor?: string
}

async function getLogContentPage(
  { projectRef, name, visibility, favorite, sort, limit = 100, cursor }: LogContentVariables,
  signal?: AbortSignal,
  headers?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: {
      path: { ref: projectRef },
      query: {
        type: 'log_sql',
        name,
        limit: String(limit),
        cursor,
        visibility,
        favorite: favorite?.toString(),
        sort_by: sort,
        sort_order: sort === 'name' ? 'asc' : 'desc',
      },
    },
    signal,
    headers,
  })
  if (error) handleError(error)
  return data
}

export async function getAllLogContent(
  variables: Omit<LogContentVariables, 'cursor'>,
  signal?: AbortSignal
) {
  const rows: ContentBase[] = []
  let cursor: string | undefined
  do {
    const data = await getLogContentPage({ ...variables, cursor }, signal)
    rows.push(...data.data)
    cursor = data.cursor
  } while (cursor)
  return rows
}

export async function getLogSqlSnippetPage(
  variables: LogContentVariables,
  signal?: AbortSignal,
  headers?: HeadersInit
) {
  let cursor = variables.cursor
  do {
    const data = await getLogContentPage({ ...variables, cursor }, signal, headers)
    const rows = data.data
      .filter((row) => row.type === 'log_sql' && !isLogsViewContent(row))
      .map(parseLogSqlSnippet)
    cursor = data.cursor
    if (rows.length > 0 || !cursor) return { cursor, rows }
  } while (cursor)
  return { cursor: undefined, rows: [] }
}
