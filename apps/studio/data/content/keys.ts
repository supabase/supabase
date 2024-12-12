import type { ContentType } from './content-query'
import type { SqlSnippet } from './sql-snippets-query'

export const contentKeys = {
  allContentLists: (projectRef: string | undefined) => ['projects', projectRef, 'content'] as const,
  list: (projectRef: string | undefined, type: ContentType | undefined) =>
    ['projects', projectRef, 'content', type] as const,
  sqlSnippets: (
    projectRef: string | undefined,
    {
      sort,
      name,
      visibility,
      favorite,
    }: {
      sort?: 'inserted_at' | 'name'
      name?: string
      visibility?: SqlSnippet['visibility']
      favorite?: boolean
    }
  ) => ['projects', projectRef, 'content', 'sql', { sort, visibility, favorite, name }] as const,
  folders: (projectRef: string | undefined, id?: string) =>
    ['projects', projectRef, 'content', 'folders', id].filter(Boolean),
  resource: (projectRef: string | undefined, id?: string) =>
    ['projects', projectRef, 'content', id] as const,
  count: (
    projectRef: string | undefined,
    type?: string,
    options?: { visibility?: SqlSnippet['visibility']; favorite?: boolean; name?: string }
  ) => ['projects', projectRef, 'content', 'count', type, options].filter(Boolean),
}
