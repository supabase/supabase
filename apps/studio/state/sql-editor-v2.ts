import type { QueryPlanRow } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { UpsertContentPayload, upsertContent } from 'data/content/content-upsert-mutation'
import { contentKeys } from 'data/content/keys'
import { createSQLSnippetFolder } from 'data/content/sql-folder-create-mutation'
import { updateSQLSnippetFolder } from 'data/content/sql-folder-update-mutation'
import { Snippet, SnippetFolder } from 'data/content/sql-folders-query'
import { getQueryClient } from 'data/query-client'
import { debounce, memoize } from 'lodash'
import { useMemo } from 'react'
import { toast } from 'sonner'
import type { SqlSnippets } from 'types'
import { proxy, ref, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxyMap } from 'valtio/utils'

type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
  status?: 'editing' | 'saving' | 'idle'
}

type StateSnippet = {
  projectRef: string
  splitSizes: number[]
  snippet: SnippetWithContent
}

// [Joshen] API codegen is somehow missing the content property
export interface SnippetWithContent extends Snippet {
  content?: SqlSnippets.Content
  isNotSavedInDatabaseYet?: boolean
}

const NEW_FOLDER_ID = 'new-folder'

export const sqlEditorState = proxy({
  // ========================================================================
  // ## Data properties within the store
  // ========================================================================

  /**
   * Currently limitations include supporting up to one level of folders from root, and only private snippets
   */
  folders: {} as {
    [folderId: string]: StateSnippetFolder
  },

  /**
   * Private and shared snippets only, favorite snippets are derivatives of them by the `favorite` property
   */
  snippets: {} as {
    [snippetId: string]: StateSnippet
  },

  /**
   * Query results, if any, for a snippet. Set as an array per snippetId as we were previously experimenting
   * with having a Jupyter notebook like UI but it never took off. Nonetheless kept this data structure as
   * we'd also want to support returning multiple results from a single query (e.g From a query that contains
   * multiple select statements), and this will allow us to do quite easily.
   */
  results: {} as {
    [snippetId: string]: {
      rows: any[]
      error?: any
      autoLimit?: number
    }[]
  },

  /**
   * Explain results, if any, for a snippet
   */
  explainResults: {} as {
    [snippetId: string]: {
      rows: QueryPlanRow[]
      error?: { message: string; formattedError?: string }
    }
  },
  /**
   * Synchronous saving of folders and snippets (debounce behavior). Key is the snippet id, value is shouldInvalidate
   */
  needsSaving: proxyMap<string, boolean>([]),
  /**
   * Stores the state of each snippet
   */
  savingStates: {} as {
    [snippetId: string]: 'IDLE' | 'UPDATING' | 'UPDATING_FAILED'
  },
  /**
   * UI-imposed limit for the number of results a query can return (applied to the SQL query being run if applicable).
   * Acts as a safeguard to prevent accidentally taking down the database from a really large SELECT query.
   * Related to `autoLimit` in `results`. Refer to `checkIfAppendLimitRequired` and `suffixWithLimit` for usage.
   */
  limit: 100,

  /**
   * Used for error handling after optimistical rendering from renaming a folder
   */
  lastUpdatedFolderName: '',

  /**
   * For Assistant to render diffing into the editor
   */
  diffContent: undefined as undefined | { sql: string; diffType: DiffType },

  get allFolderNames() {
    return Object.values(sqlEditorState.folders).map((x) => x.folder.name)
  },

  // ========================================================================
  // ## Methods to interact the store with
  // ========================================================================

  setDiffContent: (sql: string, diffType: DiffType) =>
    (sqlEditorState.diffContent = { sql, diffType }),

  /**
   * Load snippet into SQL Editor Valtio store
   */
  addSnippet: ({ projectRef, snippet }: { projectRef: string; snippet: SnippetWithContent }) => {
    if (sqlEditorState.snippets[snippet.id]) return

    sqlEditorState.snippets[snippet.id] = { projectRef, splitSizes: [50, 50], snippet }
    sqlEditorState.results[snippet.id] = []
    sqlEditorState.explainResults[snippet.id] = { rows: [] }
    sqlEditorState.savingStates[snippet.id] = 'IDLE'
  },

  /**
   * Update snippet data (e.g name, visibility, chart) and queue for sync saving
   */
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

  /**
   * Load snippet content into the snippet within the Valtio store.
   * Snippets fetched from the GET /content or /folders endpoints do not have the content loaded initially
   * to reduce the response size from the API. Hence content for each snippet has to be loaded on demand
   */
  setSnippet: (projectRef: string, snippet: SnippetWithContent) => {
    let storedSnippet = sqlEditorState.snippets[snippet.id]
    if (storedSnippet) {
      if (!storedSnippet.snippet.content) {
        storedSnippet.snippet.content = snippet.content
      }
    } else {
      sqlEditorState.addSnippet({ projectRef: projectRef, snippet })
    }
  },

  /**
   * Update the snippet content of a snippet and queue for sync saving
   * Possibly can consolidate with `updateSnippet` to simplify
   */
  setSql: ({
    id,
    sql,
    shouldInvalidate = false,
  }: {
    id: string
    sql: string
    shouldInvalidate?: boolean
  }) => {
    let snippet = sqlEditorState.snippets[id]?.snippet
    if (snippet?.content) {
      snippet.content.sql = sql
      sqlEditorState.needsSaving.set(id, shouldInvalidate)
    }
  },

  /**
   * Update snippet in Valtio store after renaming
   * Renaming a snippet follows an async saving and hence doesnt require queuing for sync saving here
   * Refer to `RenameQueryModal.tsx` for more details
   */
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
    }
  },

  /**
   * Remove snippet from the Valtio store, and optionally remove snippet from the sync saving queue
   */
  removeSnippet: (id: string, skipSave: boolean = false) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults

    const { [id]: explainResult, ...otherExplainResults } = sqlEditorState.explainResults
    sqlEditorState.explainResults = otherExplainResults

    if (!skipSave) sqlEditorState.needsSaving.delete(id)
  },

  /**
   * Load folder into SQL Editor Valtio store
   */
  addFolder: ({ projectRef, folder }: { projectRef: string; folder: SnippetFolder }) => {
    if (sqlEditorState.folders[folder.id]) return
    sqlEditorState.folders[folder.id] = { projectRef, folder }
  },

  /**
   * Adds a new folder placeholder for the UI to render
   */
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

  /**
   * For renaming a folder, queue for sync saving if pass all validations
   */
  saveFolder: ({ id, name }: { id: string; name: string }) => {
    let storeFolder = sqlEditorState.folders[id]
    const isNewFolder = id === 'new-folder'
    const hasChanges = storeFolder.folder.name !== name

    if (isNewFolder && sqlEditorState.allFolderNames.includes(name)) {
      sqlEditorState.removeFolder(id)
      return toast.error('Unable to create new folder: This folder name already exists')
    } else if (hasChanges && sqlEditorState.allFolderNames.includes(name)) {
      storeFolder.status = 'idle'
      return toast.error('Unable to update folder: This folder name already exists')
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

  /**
   * Remove folder from the Valtio store
   * Deleting a folder follows an async saving and hence doesnt require queuing for sync saving here
   * Refer to `SQLEditorNav` for more details (ConfirmationModal for deleting a folder)
   */
  removeFolder: (id: string) => {
    const { [id]: folder, ...otherFolders } = sqlEditorState.folders
    sqlEditorState.folders = otherFolders
  },

  /**
   * Set the value for the auto limit for SELECT based SQL queries
   */
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
      // Use ref() to prevent Valtio from creating proxies for each row object.
      // This is critical for large result sets - without ref(), Valtio wraps every
      // row and nested property in a Proxy, causing massive memory overhead.
      // Alright to use ref() in this case as the data is meant to be read-only and we
      // don't need to track changes to the underlying data
      sqlEditorState.results[id] = [{ rows: ref(results), autoLimit }]
    }
  },

  addResultError: (id: string, error: any, autoLimit?: number) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id] = [{ rows: ref([]), error, autoLimit }]
    }
  },

  resetResult: (id: string) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id] = []
    }
  },

  addExplainResult: (id: string, results: QueryPlanRow[]) => {
    // Use ref() to prevent Valtio from creating proxies for each row object
    sqlEditorState.explainResults[id] = { rows: ref(results) }
  },

  addExplainResultError: (id: string, error: { message: string; formattedError?: string }) => {
    sqlEditorState.explainResults[id] = { rows: ref([]), error }
  },

  resetExplainResult: (id: string) => {
    sqlEditorState.explainResults[id] = { rows: [] }
  },

  resetResults: (id: string) => {
    sqlEditorState.resetResult(id)
    sqlEditorState.resetExplainResult(id)
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
        .map((x) => x.folder)
        // folders don't have created_at or inserted_at, so we always sort by name
        .sort((a, b) => a.name.localeCompare(b.name)),
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
  shouldInvalidate = false
) {
  try {
    sqlEditorState.savingStates[id] = 'UPDATING'
    await upsertContent({ projectRef, payload })

    if (shouldInvalidate) {
      const queryClient = getQueryClient()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentKeys.count(projectRef, 'sql') }),
        queryClient.invalidateQueries({ queryKey: contentKeys.sqlSnippets(projectRef) }),
        queryClient.invalidateQueries({ queryKey: contentKeys.folders(projectRef) }),
      ])
    }

    let snippet = sqlEditorState.snippets[id]?.snippet
    if (snippet?.content && 'isNotSavedInDatabaseYet' in snippet) {
      snippet.isNotSavedInDatabaseYet = false
    }
    sqlEditorState.savingStates[id] = 'IDLE'
  } catch (error) {
    sqlEditorState.savingStates[id] = 'UPDATING_FAILED'
  }
}

const memoizedUpsertSnippet = memoize((_id: string) => debounce(upsertSnippet, 1000))

const debouncedUpdateSnippet = (
  id: string,
  projectRef: string,
  payload: UpsertContentPayload,
  shouldInvalidate = false
) => memoizedUpsertSnippet(id)(id, projectRef, payload, shouldInvalidate)

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
              favorite: favorite ?? false,
              content: {
                ...content!,
                content_id: id,
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
