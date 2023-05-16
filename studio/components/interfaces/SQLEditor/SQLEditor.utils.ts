// @ts-ignore
import MarkdownTable from 'markdown-table'
import { NEW_SQL_SNIPPET_SKELETON } from './SQLEditor.constants'
import { SqlSnippets, UserContent } from 'types'

export const getResultsMarkdown = (results: any[]) => {
  const columns = Object.keys(results[0])
  const rows = results.map((x: any) => {
    const temp: any[] = []
    columns.forEach((col) => temp.push(x[col]))
    return temp
  })
  const table = [columns].concat(rows)
  return MarkdownTable(table)
}

export const createSqlSnippetSkeleton = ({
  name,
  sql,
  owner_id,
}: {
  name?: string
  sql?: string
  owner_id?: number
} = {}): UserContent<SqlSnippets.Content> => {
  return {
    ...NEW_SQL_SNIPPET_SKELETON,
    ...(name && { name }),
    ...(owner_id && { owner_id }),
    content: {
      ...NEW_SQL_SNIPPET_SKELETON.content,
      content_id: '',
      sql: sql ?? '',
    },
  }
}
