// @ts-ignore
import MarkdownTable from 'markdown-table'
import { NEW_SQL_SNIPPET_SKELETON, destructiveSqlRegex } from './SQLEditor.constants'
import { SqlSnippets, UserContent } from 'types'
import { DiffType } from './SQLEditor.types'
import { removeCommentsFromSql } from 'lib/helpers'

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
  id,
  name,
  sql,
  owner_id,
  project_id,
}: {
  id?: string
  name?: string
  sql?: string
  owner_id?: number
  project_id?: number
} = {}): UserContent<SqlSnippets.Content> => {
  return {
    ...NEW_SQL_SNIPPET_SKELETON,
    id,
    ...(name && { name }),
    ...(owner_id && { owner_id }),
    ...(project_id && { project_id }),
    content: {
      ...NEW_SQL_SNIPPET_SKELETON.content,
      content_id: id ?? '',
      sql: sql ?? '',
    },
  }
}

export function getDiffTypeButtonLabel(diffType: DiffType) {
  switch (diffType) {
    case DiffType.Modification:
      return 'Accept change'
    case DiffType.Addition:
      return 'Accept addition'
    case DiffType.NewSnippet:
      return 'Create new snippet'
    default:
      throw new Error(`Unknown diff type '${diffType}'`)
  }
}

export function getDiffTypeDropdownLabel(diffType: DiffType) {
  switch (diffType) {
    case DiffType.Modification:
      return 'Compare as change'
    case DiffType.Addition:
      return 'Compare as addition'
    case DiffType.NewSnippet:
      return 'Compare as new snippet'
    default:
      throw new Error(`Unknown diff type '${diffType}'`)
  }
}

export function checkDestructiveQuery(sql: string) {
  return destructiveSqlRegex.some((regex) => regex.test(removeCommentsFromSql(sql)))
}
