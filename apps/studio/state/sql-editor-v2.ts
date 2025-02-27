import { debounce, memoize } from 'lodash'
import { toast } from 'sonner'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxyMap } from 'valtio/utils'

import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { upsertContent, UpsertContentPayload } from 'data/content/content-upsert-mutation'
import { contentKeys } from 'data/content/keys'
import { createSQLSnippetFolder } from 'data/content/sql-folder-create-mutation'
import { updateSQLSnippetFolder } from 'data/content/sql-folder-update-mutation'
import { Snippet, SnippetFolder } from 'data/content/sql-folders-query'
import { getQueryClient } from 'data/query-client'
import { useMemo } from 'react'
import { SqlSnippets } from 'types'

export type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
  status?: 'editing' | 'saving' | 'idle'
}

// [Joshen] API codegen is somehow missing the content property
export interface SnippetWithContent extends Snippet {
  content?: SqlSnippets.Content
}

export type StateSnippet = {
  projectRef: string
  splitSizes: number[]
  snippet: SnippetWithContent
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

  // Query results, if any, for a snippet
  results: {} as {
    [snippetId: string]: {
      rows: any[]
      error?: any
      autoLimit?: number
    }[]
  },
  // Synchronous saving of folders and snippets (debounce behavior)
  // key is the snippet id, value is shouldInvalidate
  needsSaving: proxyMap<string, boolean>([]),
  // Stores the state of each snippet
  savingStates: {} as {
    [snippetId: string]: 'IDLE' | 'UPDATING' | 'UPDATING_FAILED'
  },
  limit: 100,
  // For handling renaming folder failed
  lastUpdatedFolderName: '',

  // For Assistant to render diffing into the editor
  diffContent: undefined as undefined | { sql: string; diffType: DiffType },

  get allFolderNames() {
    return Object.values(sqlEditorState.folders).map((x) => x.folder.name)
  },

  // ========================================================================
  // ## Methods to interact the store with
  // ========================================================================

  setDiffContent: (sql: string, diffType: DiffType) =>
    (sqlEditorState.diffContent = { sql, diffType }),

  addSnippet: ({ projectRef, snippet }: { projectRef: string; snippet: SnippetWithContent }) => {
    if (sqlEditorState.snippets[snippet.id]) return

    sqlEditorState.snippets[snippet.id] = { projectRef, splitSizes: [50, 50], snippet }
    sqlEditorState.results[snippet.id] = []
    sqlEditorState.savingStates[snippet.id] = 'IDLE'
  },

  updateSnippet: ({
    id,
    snippet,
    skipSave = false,
  }: {
    id: string
    snippet: Partial<Snippet>
    skipSave?: boolean
  }) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet = {
        ...sqlEditorState.snippets[id].snippet,
        ...snippet,
      }
      if (!skipSave) sqlEditorState.needsSaving.set(id, true)
    }
  },

  setSnippet: (projectRef: string, snippet: SnippetWithContent) => {
    let storedSnippet = sqlEditorState.snippets[snippet.id]
    if (storedSnippet) {
      if (!storedSnippet.snippet.content) {
        storedSnippet.snippet.content = snippet.content
        sqlEditorState.needsSaving.set(storedSnippet.snippet.id, true)
      }
    } else {
      sqlEditorState.addSnippet({ projectRef: projectRef, snippet })
    }
  },

  setSql: (id: string, sql: string) => {
    let snippet = sqlEditorState.snippets[id]?.snippet
    if (snippet?.content) {
      snippet.content.sql = sql
      sqlEditorState.needsSaving.set(id, false)
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
    let snippet = sqlEditorState.snippets[id]?.snippet
    if (snippet) {
      snippet.name = name
      snippet.description = description

      sqlEditorState.needsSaving.set(id, true)
    }
  },

  removeSnippet: (id: string) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults

    sqlEditorState.needsSaving.delete(id)
  },

  addFolder: ({ projectRef, folder }: { projectRef: string; folder: SnippetFolder }) => {
    if (sqlEditorState.folders[folder.id]) return

    sqlEditorState.folders[folder.id] = { projectRef, folder }
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
    sqlEditorState.folders[id].status = 'editing'
  },

  saveFolder: ({ id, name }: { id: string; name: string }) => {
    let storeFolder = sqlEditorState.folders[id]
    const hasChanges = storeFolder.folder.name !== name

    if (id === 'new-folder' && sqlEditorState.allFolderNames.includes(name)) {
      sqlEditorState.removeFolder(id)
      return toast.error('This folder name already exists')
    } else if (hasChanges && sqlEditorState.allFolderNames.includes(name)) {
      storeFolder.status = 'idle'
      return toast.error('This folder name already exists')
    }

    const originalFolderName = storeFolder.folder.name.slice()

    storeFolder.status = hasChanges ? 'saving' : 'idle'
    storeFolder.folder.id = id
    storeFolder.folder.name = name

    if (hasChanges) {
      sqlEditorState.lastUpdatedFolderName = originalFolderName
      sqlEditorState.needsSaving.set(id, true)
    }
  },

  removeFolder: (id: string) => {
    const { [id]: folder, ...otherFolders } = sqlEditorState.folders
    sqlEditorState.folders = otherFolders
  },

  setLimit: (value: number) => (sqlEditorState.limit = value),

  addNeedsSaving: (id: string) => sqlEditorState.needsSaving.set(id, true),

  addFavorite: (id: string) => {
    const storeSnippet = sqlEditorState.snippets[id]
    if (storeSnippet) {
      storeSnippet.snippet.favorite = true
      sqlEditorState.needsSaving.set(id, true)
    }
  },

  removeFavorite: (id: string) => {
    const storeSnippet = sqlEditorState.snippets[id]
    if (storeSnippet.snippet) {
      storeSnippet.snippet.favorite = false
      sqlEditorState.needsSaving.set(id, true)
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

  return useMemo(
    () =>
      Object.values(snapshot.folders)
        .filter((x) => x.projectRef === projectRef)
        .map((x) => x.folder),
    [projectRef, snapshot.folders]
  )
}

/**
 * Get ALL snippets for a project
 */
export const useSnippets = (projectRef: string) => {
  const snapshot = useSqlEditorV2StateSnapshot()

  return useMemo(
    () =>
      Object.values(snapshot.snippets)
        .filter((storeSnippet) => storeSnippet.projectRef === projectRef)
        .map((storeSnippet) => storeSnippet.snippet),
    [projectRef, snapshot.snippets]
  )
}

// ========================================================================
// ## Below are all the asynchronous saving logic for the SQL Editor
// ========================================================================

async function upsertSnippet(
  id: string,
  projectRef: string,
  payload: UpsertContentPayload,
  shouldInvalidate = true
) {
  try {
    sqlEditorState.savingStates[id] = 'UPDATING'
    await upsertContent({ projectRef, payload })

    if (shouldInvalidate) {
      const queryClient = getQueryClient()
      await Promise.all([
        queryClient.invalidateQueries(contentKeys.count(projectRef, 'sql')),
        queryClient.invalidateQueries(contentKeys.sqlSnippets(projectRef)),
        queryClient.invalidateQueries(contentKeys.folders(projectRef)),
      ])
    }

    sqlEditorState.savingStates[id] = 'IDLE'
  } catch (error) {
    sqlEditorState.savingStates[id] = 'UPDATING_FAILED'
  }
}

const memoizedUpdateSnippet = memoize((_id: string) => debounce(upsertSnippet, 1000))

const debouncedUpdateSnippet = (
  id: string,
  projectRef: string,
  payload: UpsertContentPayload,
  shouldInvalidate = false
) => memoizedUpdateSnippet(id)(id, projectRef, payload, shouldInvalidate)

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
      sqlEditorState.folders[id].status = 'idle'
    }
  } catch (error: any) {
    toast.error(`Failed to save folder: ${error.message}`)
    if (error.message.includes('create')) {
      sqlEditorState.removeFolder(id)
    } else if (
      error.message.includes('update') &&
      sqlEditorState.lastUpdatedFolderName.length > 0
    ) {
      let storeFolder = sqlEditorState.folders[id]

      storeFolder.status = 'idle'
      storeFolder.folder.name = sqlEditorState.lastUpdatedFolderName
    }
  } finally {
    sqlEditorState.lastUpdatedFolderName = ''
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

    state.needsSaving.forEach((shouldInvalidate, id) => {
      const snippet = state.snippets[id]
      const folder = state.folders[id]

      if (snippet) {
        const {
          name,
          description,
          visibility,
          project_id,
          owner_id,
          folder_id,
          content,
          favorite,
        } = snippet.snippet

        if (visibility === 'project' && !!folder_id) {
          toast.error('Shared snippet cannot be within a folder')
        } else {
          debouncedUpdateSnippet(
            id,
            snippet.projectRef,
            {
              id,
              type: 'sql',
              name: name ?? 'Untitled',
              description: description ?? '',
              visibility: visibility ?? 'user',
              project_id: project_id ?? 0,
              owner_id: owner_id,
              folder_id: folder_id ?? undefined,
              content: {
                ...content!,
                content_id: id,
                favorite: favorite ?? false,
              },
            },
            shouldInvalidate
          )
          sqlEditorState.needsSaving.delete(id)
        }
      } else if (folder) {
        upsertFolder(id, folder.projectRef, folder.folder.name)
        sqlEditorState.needsSaving.delete(id)
      }
    })
  })
}
