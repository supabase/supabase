import { debounce, memoize } from 'lodash'
import { toast } from 'sonner'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxySet } from 'valtio/utils'

import { UpsertContentPayloadV2, upsertContent } from 'data/content/content-upsert-v2-mutation'
import { contentKeys } from 'data/content/keys'
import { createSQLSnippetFolder } from 'data/content/sql-folder-create-mutation'
import { updateSQLSnippetFolder } from 'data/content/sql-folder-update-mutation'
import { Snippet, SnippetFolder, SnippetFolderResponse } from 'data/content/sql-folders-query'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { getQueryClient } from 'data/query-client'
import { getContentById } from 'data/content/content-id-query'

export type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
  status?: 'editing' | 'saving' | 'idle'
}

// [Joshen] API codegen is somehow missing the content property
export interface SnippetContent extends Snippet {
  content?: any
}

export type StateSnippet = {
  projectRef: string
  splitSizes: number[]
  snippet: SnippetContent
}

const NEW_FOLDER_ID = 'new-folder'

export const sqlEditorState = proxy({
  // ========================================================================
  // ## Data properties within the store
  // ========================================================================
  folders: {} as {
    [folderId: string]: StateSnippetFolder
  },
  // Private and Shared snippets only
  snippets: {} as {
    [snippetId: string]: StateSnippet
  },
  // We're storing favorites separately as they need to be a flat list and hence
  // cannot be derived from snippets as folder contents are loaded on demand
  favoriteSnippets: {} as {
    [snippetId: string]: {
      projectRef: string
      snippet: SqlSnippet
    }
  },
  // Query results, if any, for a snippet
  results: {} as {
    [snippetId: string]: {
      rows: any[]
      error?: any
      autoLimit?: number
    }[]
  },
  // Project ref as the key, marks which project already has snippets loaded
  loaded: {} as {
    [projectRef: string]: boolean
  },
  privateSnippetCount: {} as {
    [projectRef: string]: number
  },
  // Synchronous saving of folders and snippets (debounce behavior)
  needsSaving: proxySet<string>([]),
  // Stores the state of each snippet
  savingStates: {} as {
    [snippetId: string]: 'IDLE' | 'UPDATING' | 'UPDATING_FAILED'
  },
  limit: 100,
  order: 'inserted_at' as 'name' | 'inserted_at',

  // ========================================================================
  // ## Methods to interact the store with
  // ========================================================================

  // Initial loading of data into UI, only called once when first loading data
  // Note that snippets here do not have the content property, and will need to be
  // further loaded on demand instead. Entry point from SQLEditorNav.tsx
  initializeRemoteSnippets: ({
    projectRef,
    data,
    sort,
  }: {
    projectRef: string
    data: SnippetFolderResponse
    sort: 'name' | 'inserted_at'
  }) => {
    const { folders, contents } = data
    folders?.forEach((folder) => {
      sqlEditorState.folders[folder.id] = { projectRef, folder }
    })
    contents?.forEach((snippet) => {
      sqlEditorState.addSnippet({ projectRef, snippet })
    })
    sqlEditorState.loaded[projectRef] = true
    sqlEditorState.order = sort
  },

  initializeFavoriteSnippets: ({
    projectRef,
    snippets,
  }: {
    projectRef: string
    snippets: SqlSnippet[]
  }) => {
    snippets.forEach((snippet) => {
      if (snippet.id && sqlEditorState.favoriteSnippets[snippet.id]?.snippet === undefined) {
        sqlEditorState.favoriteSnippets[snippet.id] = { projectRef, snippet }
      }
    })
  },

  setOrder: (value: 'name' | 'inserted_at') => (sqlEditorState.order = value),

  setPrivateSnippetCount: ({ projectRef, value }: { projectRef: string; value: number }) => {
    sqlEditorState.privateSnippetCount[projectRef] = value
  },

  addSnippet: ({ projectRef, snippet }: { projectRef: string; snippet: Snippet }) => {
    if (snippet.id && sqlEditorState.snippets[snippet.id]?.snippet?.content === undefined) {
      sqlEditorState.snippets[snippet.id] = { projectRef, splitSizes: [50, 50], snippet }
      sqlEditorState.results[snippet.id] = []
      sqlEditorState.savingStates[snippet.id] = 'IDLE'
    }
  },

  updateSnippet: ({
    id,
    snippet,
    skipSave = false,
  }: {
    id: string
    snippet: Snippet
    skipSave?: boolean
  }) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet = {
        ...sqlEditorState.snippets[id].snippet,
        ...snippet,
      }
      if (!skipSave) sqlEditorState.needsSaving.add(id)
    }
  },

  setSql: (id: string, sql: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet.content.sql = sql
      sqlEditorState.needsSaving.add(id)
    }
  },

  renameSnippet: ({
    id,
    name,
    description,
  }: {
    id: string
    name: string
    description?: string
  }) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id] = {
        ...sqlEditorState.snippets[id],
        snippet: { ...sqlEditorState.snippets[id].snippet, name, description },
      }
      sqlEditorState.needsSaving.add(id)
    }
  },

  removeSnippet: (id: string) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults

    sqlEditorState.needsSaving.delete(id)
  },

  addNewFolder: ({ projectRef }: { projectRef: string }) => {
    // [Joshen] Use this to identify new folders that have yet to be saved
    const id = NEW_FOLDER_ID
    sqlEditorState.folders[id] = {
      projectRef,
      status: 'editing',
      folder: {
        id,
        name: '',
        owner_id: -1,
        project_id: -1,
        parent_id: null,
      },
    }
  },

  editFolder: (id: string) => {
    sqlEditorState.folders[id] = { ...sqlEditorState.folders[id], status: 'editing' }
  },

  saveFolder: ({ id, name }: { id: string; name: string }) => {
    const hasChanges = sqlEditorState.folders[id].folder.name !== name
    sqlEditorState.folders[id] = {
      projectRef: sqlEditorState.folders[id].projectRef,
      status: hasChanges ? 'saving' : 'idle',
      folder: {
        ...sqlEditorState.folders[id].folder,
        id,
        name,
      },
    }
    if (hasChanges) sqlEditorState.needsSaving.add(id)
  },

  removeFolder: (id: string) => {
    const { [id]: folder, ...otherFolders } = sqlEditorState.folders
    sqlEditorState.folders = otherFolders
  },

  setLimit: (value: number) => (sqlEditorState.limit = value),

  addNeedsSaving: (id: string) => sqlEditorState.needsSaving.add(id),

  addFavorite: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id] = {
        ...sqlEditorState.snippets[id],
        snippet: {
          ...sqlEditorState.snippets[id].snippet,
          favorite: true,
        },
      }

      sqlEditorState.favoriteSnippets[id] = {
        projectRef: sqlEditorState.snippets[id].projectRef,
        snippet: {
          ...sqlEditorState.snippets[id].snippet,
          folder_id: undefined,
        } as unknown as SqlSnippet,
      }

      sqlEditorState.needsSaving.add(id)
    }
  },

  removeFavorite: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id] = {
        ...sqlEditorState.snippets[id],
        snippet: {
          ...sqlEditorState.snippets[id].snippet,
          favorite: false,
        },
      }

      const { [id]: snippet, ...otherSnippets } = sqlEditorState.favoriteSnippets
      sqlEditorState.favoriteSnippets = otherSnippets

      sqlEditorState.needsSaving.add(id)
    }
  },

  shareSnippet: async (id: string, visibility: 'user' | 'project' | 'org' | 'public') => {
    const storeSnippet = sqlEditorState.snippets[id]

    if (storeSnippet) {
      let snippetContent = storeSnippet.snippet.content
      if (snippetContent === undefined) {
        const { content } = await getContentById({ projectRef: storeSnippet.projectRef, id })
        snippetContent = content
      }

      if (snippetContent === undefined) {
        // [Joshen] Just as a final check - to ensure that the content is minimally there (empty string is fine)
        return toast.error('Unable to share snippet: Content is missing')
      }

      sqlEditorState.snippets[id] = {
        ...storeSnippet,
        snippet: {
          ...storeSnippet.snippet,
          content: snippetContent,
          visibility,
          folder_id: null as any,
        },
      }

      sqlEditorState.needsSaving.add(id)
    }
  },

  addResult: (id: string, results: any[], autoLimit?: number) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id].unshift({ rows: results, autoLimit })
    }
  },

  addResultError: (id: string, error: any, autoLimit?: number) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id].unshift({ rows: [], error, autoLimit })
    }
  },

  resetResult: (id: string) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id] = []
    }
  },
})

// ========================================================================
// ## Expose entry points into this Valtio store
// ========================================================================

export const getSqlEditorV2StateSnapshot = () => snapshot(sqlEditorState)

export const useSqlEditorV2StateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorState, options)

export const useSnippetFolders = (projectRef: string) => {
  const snapshot = useSqlEditorV2StateSnapshot()

  return Object.values(snapshot.folders)
    .filter((x) => x.projectRef === projectRef)
    .map((x) => x.folder)
}

export const useSnippets = (projectRef: string) => {
  const snapshot = useSqlEditorV2StateSnapshot()

  return Object.values(snapshot.snippets)
    .filter((x) => x.projectRef === projectRef)
    .map((x) => x.snippet)
    .sort((a, b) => {
      if (snapshot.order === 'name') return a.name.localeCompare(b.name)
      else return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
    })
}

export const useFavoriteSnippets = (projectRef: string) => {
  const snapshot = useSqlEditorV2StateSnapshot()

  return Object.values(snapshot.favoriteSnippets)
    .filter((x) => x.projectRef === projectRef)
    .map((x) => x.snippet)
    .sort((a, b) => {
      if (snapshot.order === 'name') return a.name.localeCompare(b.name)
      else return new Date(b.inserted_at ?? '').valueOf() - new Date(a.inserted_at ?? '').valueOf()
    })
}

// ========================================================================
// ## Below are all the asynchronous saving logic for the SQL Editor
// ========================================================================

async function upsertSnippet(id: string, projectRef: string, payload: UpsertContentPayloadV2) {
  try {
    sqlEditorState.savingStates[id] = 'UPDATING'
    await upsertContent({ projectRef, payload })

    const queryClient = getQueryClient()
    await queryClient.invalidateQueries(contentKeys.count(projectRef, 'sql'))

    sqlEditorState.savingStates[id] = 'IDLE'
  } catch (error) {
    sqlEditorState.savingStates[id] = 'UPDATING_FAILED'
  }
}

const memoizedUpdateSnippet = memoize((_id: string) => debounce(upsertSnippet, 1000))

const debouncedUpdateSnippet = (id: string, projectRef: string, payload: UpsertContentPayloadV2) =>
  memoizedUpdateSnippet(id)(id, projectRef, payload)

async function upsertFolder(id: string, projectRef: string, name: string) {
  try {
    if (id === NEW_FOLDER_ID) {
      const res = await createSQLSnippetFolder({ projectRef, name })
      toast.success('Successfully created folder')
      sqlEditorState.removeFolder(NEW_FOLDER_ID)
      sqlEditorState.folders[res.id] = { projectRef, status: 'idle', folder: res }
    } else {
      await updateSQLSnippetFolder({ projectRef, id, name })
      toast.success('Successfully updated folder')
      sqlEditorState.folders[id] = { ...sqlEditorState.folders[id], status: 'idle' }
    }
  } catch (error: any) {
    toast.error(`Failed to save folder: ${error.message}`)
  }
}

if (typeof window !== 'undefined') {
  devtools(sqlEditorState, {
    name: 'sqlEditorStateV2',
    // [Joshen] So that jest unit tests can ignore this
    enabled: process.env.NEXT_PUBLIC_ENVIRONMENT !== undefined,
  })

  subscribe(sqlEditorState.needsSaving, () => {
    const state = getSqlEditorV2StateSnapshot()

    Array.from(state.needsSaving).forEach((id) => {
      const snippet = state.snippets[id]
      const folder = state.folders[id]

      if (snippet) {
        debouncedUpdateSnippet(id, snippet.projectRef, {
          id,
          type: 'sql',
          name: snippet.snippet.name ?? 'Untitled',
          description: snippet.snippet.description ?? '',
          visibility: snippet.snippet.visibility ?? 'user',
          project_id: snippet.snippet.project_id ?? 0,
          owner_id: snippet.snippet.owner_id,
          folder_id: snippet.snippet.folder_id,
          content: {
            ...snippet.snippet.content,
            content_id: id,
            favorite: snippet.snippet.favorite,
          },
        })
        sqlEditorState.needsSaving.delete(id)
      } else if (folder) {
        upsertFolder(id, folder.projectRef, folder.folder.name)
        sqlEditorState.needsSaving.delete(id)
      }
    })
  })
}
