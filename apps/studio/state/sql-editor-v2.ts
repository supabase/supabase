import { UpsertContentPayloadV2, upsertContent } from 'data/content/content-upsert-v2-mutation'
import { Snippet, SnippetFolder, SnippetFolderResponse } from 'data/content/sql-folders-query'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { debounce, memoize } from 'lodash'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxySet } from 'valtio/utils'

export type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
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

// [Joshen] Quick thought process of how this store will work
// TBD

export const sqlEditorState = proxy({
  // Keep folders and snippets as two separate flat lists, instead of a tree
  folders: {} as {
    [folderId: string]: StateSnippetFolder
  },
  snippets: {} as {
    [snippetId: string]: StateSnippet
  },
  // Query results, if any, for a snippet
  results: {} as {
    [snippetId: string]: { rows: any[]; error?: any }[]
  },
  // Project ref as the top level key, followed by folder ID, then IDs of each snippet as the order
  // Folder ID of the root level will just be "root", the rest will be the folder's UUID
  // This is so that snippets are sorted within each folder, not across
  // [Joshen] TBD - do we really need this? why not just client side sorting?
  orders: {} as {
    [projectRef: string]: { [folderId: string]: string[] }
  },
  // Project ref as the key, marks which project already has snippets loaded
  loaded: {} as {
    [projectRef: string]: boolean
  },
  // Synchronous saving of snippets (debounce behaviour)
  needsSaving: proxySet<string>([]),
  // Stores the state of each snippet
  savingStates: {} as {
    [snippetId: string]: 'IDLE' | 'UPDATING' | 'UPDATING_FAILED'
  },

  // Initial loading of data into UI, only called once when first loading data
  // Note that snippets here do not have the content property, and will need to be
  // further loaded on demand instead. Entry point from SQLEditorNav.tsx
  initializeRemoteSnippets: ({
    projectRef,
    data,
  }: {
    projectRef: string
    data: SnippetFolderResponse
  }) => {
    const { folders, contents } = data
    folders?.forEach((folder) => {
      sqlEditorState.folders[folder.id] = { projectRef, folder }
    })
    contents?.forEach((snippet) => {
      sqlEditorState.addSnippet({ projectRef, snippet })
    })
    sqlEditorState.loaded[projectRef] = true

    // if (!sqlEditorState.orders[projectRef] && contents !== undefined) {
    //   const orderedSnippets = sqlEditorState.orderSnippets(contents)
    //   sqlEditorState.orders[projectRef]['root'] = orderedSnippets.map((s) => s.id!)
    // }
  },

  addSnippet: ({ projectRef, snippet }: { projectRef: string; snippet: Snippet }) => {
    if (snippet.id && sqlEditorState.snippets[snippet.id]?.snippet?.content === undefined) {
      sqlEditorState.snippets[snippet.id] = { projectRef, splitSizes: [50, 50], snippet }
      sqlEditorState.results[snippet.id] = []
      sqlEditorState.savingStates[snippet.id] = 'IDLE'
      // if (
      //   sqlEditorState.orders[projectRef] !== undefined &&
      //   !sqlEditorState.orders[projectRef][folderId].includes(snippet.id)
      // ) {
      //   sqlEditorState.orders[projectRef][folderId].unshift(snippet.id)
      //   sqlEditorState.reorderSnippets(projectRef, folderId)
      // }
    }
    // sqlEditorState.loaded[projectRef] = true
  },

  removeSnippet: (id: string) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults

    const { projectRef, snippet: snippetInfo } = snippet
    const folderId = snippetInfo.folder_id ?? 'root'
    sqlEditorState.orders[projectRef][folderId] = sqlEditorState.orders[projectRef][
      folderId
    ].filter((s) => s !== id)

    sqlEditorState.needsSaving.delete(id)
  },

  // Asynchronous data management for the snippets
  addNeedsSaving: (id: string) => sqlEditorState.needsSaving.add(id),

  // Utils to sort snippets alphabetically
  // orderSnippets: (snippets: Snippet[]) => {
  //   return snippets.filter((s) => Boolean(s.id)).sort((a, b) => a.name?.localeCompare(b.name))
  // },

  // reorderSnippets: (projectRef: string, folderId: string) => {
  //   sqlEditorState.orders[projectRef][folderId] = sqlEditorState
  //     .orderSnippets(
  //       sqlEditorState.orders[projectRef][folderId].map((id) => sqlEditorState.snippets[id].snippet)
  //     )
  //     .map((s) => s.id!)
  // },
})

export const getSqlEditorV2StateSnapshot = () => snapshot(sqlEditorState)

export const useSqlEditorV2StateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorState, options)

// ========================================================================
// ## Below are all the asynchronous saving logic for the SQL Editor
// ========================================================================

async function upsert(id: string, projectRef: string, payload: UpsertContentPayloadV2) {
  try {
    sqlEditorState.savingStates[id] = 'UPDATING'
    await upsertContent({
      projectRef,
      payload,
    })
    sqlEditorState.savingStates[id] = 'IDLE'
  } catch (error) {
    sqlEditorState.savingStates[id] = 'UPDATING_FAILED'
  }
}

const memoizedUpdate = memoize((_id: string) => debounce(upsert, 1000))

const debouncedUpdate = (id: string, projectRef: string, payload: UpsertContentPayloadV2) =>
  memoizedUpdate(id)(id, projectRef, payload)

if (typeof window !== 'undefined') {
  devtools(sqlEditorState, {
    name: 'sqlEditorState',
    // [Joshen] So that jest unit tests can ignore this
    enabled: process.env.NEXT_PUBLIC_ENVIRONMENT !== undefined,
  })

  subscribe(sqlEditorState.needsSaving, () => {
    const state = getSqlEditorV2StateSnapshot()

    Array.from(state.needsSaving).forEach((id) => {
      const snippet = state.snippets[id]

      if (snippet) {
        debouncedUpdate(id, snippet.projectRef, {
          id,
          type: 'sql',
          name: snippet.snippet.name ?? 'Untitled',
          description: snippet.snippet.description ?? '',
          visibility: snippet.snippet.visibility ?? 'user',
          project_id: snippet.snippet.project_id ?? 0,
          owner_id: snippet.snippet.owner_id,
          folder_id: snippet.snippet.folder_id,
          content: { ...snippet.snippet.content, content_id: id },
        })

        sqlEditorState.needsSaving.delete(id)
      }
    })
  })
}
