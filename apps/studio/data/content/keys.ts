export const contentKeys = {
  allContentLists: (projectRef: string | undefined) => ['projects', projectRef, 'content'] as const,
  infiniteList: (
    projectRef: string | undefined,
    options?: {
      type: string
      name: string | undefined
      limit?: number
      sort?: string
    }
  ) => ['projects', projectRef, 'content-infinite', options].filter(Boolean),
  list: (
    projectRef: string | undefined,
    options: { type?: string; name?: string; limit?: number }
  ) => ['projects', projectRef, 'content', options] as const,
  sqlSnippets: (
    projectRef: string | undefined,
    options?: {
      sort?: 'inserted_at' | 'name'
      name?: string
      visibility?: string
      favorite?: boolean
    }
  ) => ['projects', projectRef, 'content', 'sql', options].filter(Boolean),
  folders: (
    projectRef: string | undefined,
    options?: { sort?: 'inserted_at' | 'name'; name?: string }
  ) => ['projects', projectRef, 'content', 'folders', options].filter(Boolean),
  folderContents: (
    projectRef: string | undefined,
    id?: string,
    options?: { sort?: 'inserted_at' | 'name'; name?: string }
  ) => ['projects', projectRef, 'content', 'folders', id, options].filter(Boolean),
  resource: (projectRef: string | undefined, id?: string) =>
    ['projects', projectRef, 'content-id', id] as const,
  count: (
    projectRef: string | undefined,
    type?: string,
    options?: {
      cumulative?: boolean
      visibility?: string
      favorite?: boolean
      name?: string
    }
  ) => ['projects', projectRef, 'content', 'count', type, options].filter(Boolean),
}
