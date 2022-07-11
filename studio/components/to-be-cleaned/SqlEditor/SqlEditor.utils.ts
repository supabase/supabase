import { SqlSnippets, UserContent } from 'types'
import { NEW_SQL_SNIPPET_SKELETON } from './SqlEditor.constants'

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
