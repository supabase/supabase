import { UseQueryOptions } from '@tanstack/react-query'
import { Content, ContentData, ContentError, useContentQuery } from 'data/content/content-query'

export type SqlSnippet = Extract<Content, { type: 'sql' }>

export type SqlSnippets = {
  snippets: SqlSnippet[]
}

function filterSqlContent(content: Content): content is Extract<Content, { type: 'sql' }> {
  return content.type === 'sql'
}

export const useSqlSnippetsQuery = (
  projectRef: string | undefined,
  options: UseQueryOptions<ContentData, ContentError, SqlSnippets> = {}
) =>
  useContentQuery<SqlSnippets>(projectRef, {
    select: (data) => {
      return {
        snippets: data.content.filter(filterSqlContent),
      }
    },
    ...options,
  })
