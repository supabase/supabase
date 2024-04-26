import { Snippet, SnippetFolder, SnippetFolderResponse } from 'data/content/folders-query'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'

export type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
}

export type StateSnippet = {
  projectRef: string
  splitSizes: number[]
  snippet: Snippet
}

export const sqlEditorState = proxy({
  // Keep folders and snippets as two separate lists, instead of a tree
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

  // Utils to sort snippets alphabetically
  orderSnippets: (snippets: Snippet[]) => {
    return snippets.filter((s) => Boolean(s.id)).sort((a, b) => a.name?.localeCompare(b.name))
  },
  reorderSnippets: (projectRef: string, folderId: string) => {
    sqlEditorState.orders[projectRef][folderId] = sqlEditorState
      .orderSnippets(
        sqlEditorState.orders[projectRef][folderId].map((id) => sqlEditorState.snippets[id].snippet)
      )
      .map((s) => s.id!)
  },
  // Initial loading of data into UI, only called once when first loading data
  setRemoteSnippets: (data: SnippetFolderResponse, projectRef: string) => {
    const { folders, contents } = data
    if (!sqlEditorState.orders[projectRef] && contents !== undefined) {
      const orderedSnippets = sqlEditorState.orderSnippets(contents)
      sqlEditorState.orders[projectRef]['root'] = orderedSnippets.map((s) => s.id!)
    }

    folders?.forEach((folder) => {
      sqlEditorState.folders[folder.id] = { projectRef, folder }
    })
    contents?.forEach((snippet) => {
      sqlEditorState.addSnippet({ projectRef, folderId: 'root', snippet })
    })
  },
  addSnippet: ({
    projectRef,
    folderId,
    snippet,
  }: {
    projectRef: string
    folderId: string
    snippet: Snippet
  }) => {
    if (snippet.id && !sqlEditorState.snippets[snippet.id]) {
      sqlEditorState.snippets[snippet.id] = {
        projectRef,
        splitSizes: [50, 50],
        snippet,
      }
      sqlEditorState.results[snippet.id] = []
      sqlEditorState.savingStates[snippet.id] = 'IDLE'
      if (
        sqlEditorState.orders[projectRef] !== undefined &&
        !sqlEditorState.orders[projectRef][folderId].includes(snippet.id)
      ) {
        sqlEditorState.orders[projectRef][folderId].unshift(snippet.id)
        sqlEditorState.reorderSnippets(projectRef, folderId)
      }
    }
    sqlEditorState.loaded[projectRef] = true
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
})
