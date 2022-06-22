import { Content } from 'data/content/useContentQuery'
import { updateContent } from 'data/content/useUpdateContentMutation'
import { SqlSnippet } from 'data/sql/useSqlSnippetsQuery'
import { debounce, memoize } from 'lodash'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxySet } from 'valtio/utils'

export const sqlEditorState = proxy({
  snippets: {} as {
    [key: string]: {
      snippet: SqlSnippet
      splitSizes: number[]
      utilityPanelCollapsed: boolean
      projectRef: string
    }
  },
  results: {} as {
    [key: string]: {
      rows: any[]
      error?: any
    }[]
  },
  loaded: {} as {
    [key: string]: true
  },
  needsSaving: proxySet<string>([]),
  savingStates: {} as {
    [key: string]: 'IDLE' | 'UPDATING' | 'UPDATING_FAILED'
  },

  setInitialSnippets: (snippets: SqlSnippet[], projectRef: string) => {
    snippets.forEach((snippet) => {
      if (snippet.id && !sqlEditorState.snippets[snippet.id]) {
        sqlEditorState.snippets[snippet.id] = {
          snippet,
          splitSizes: [50, 50],
          utilityPanelCollapsed: false,
          projectRef,
        }
        sqlEditorState.results[snippet.id] = []
        sqlEditorState.savingStates[snippet.id] = 'IDLE'
      }

      sqlEditorState.loaded[projectRef] = true
    })
  },
  setSplitSizes: (id: string, splitSizes: number[]) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].splitSizes = splitSizes

      if (sqlEditorState.snippets[id].utilityPanelCollapsed) {
        sqlEditorState.snippets[id].utilityPanelCollapsed = false
      }
    }
  },
  collapseUtilityPanel: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].utilityPanelCollapsed = true
    }
  },
  restoreUtilityPanel: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].utilityPanelCollapsed = false
    }
  },
  setSql: (id: string, sql: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet.content.sql = sql
      sqlEditorState.needsSaving.add(id)
    }
  },
  addNeedsSaving: (id: string) => {
    sqlEditorState.needsSaving.add(id)
  },
  addResult: (id: string, results: any[]) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id].unshift({ rows: results })
    }
  },
  addResultError: (id: string, error: any) => {
    if (sqlEditorState.results[id]) {
      sqlEditorState.results[id].unshift({ rows: [], error })
    }
  },
  addFavorite: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet.content.favorite = true
      sqlEditorState.needsSaving.add(id)
    }
  },
  removeFavorite: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].snippet.content.favorite = false
      sqlEditorState.needsSaving.add(id)
    }
  },
})

export const getSqlEditorStateSnapshot = () => snapshot(sqlEditorState)

export const useSqlEditorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorState, options)

async function update(id: string, projectRef: string, content: Partial<Content>) {
  try {
    await updateContent({ projectRef, id, content })

    sqlEditorState.savingStates[id] = 'IDLE'
  } catch (error) {
    sqlEditorState.savingStates[id] = 'UPDATING_FAILED'
  }
}

const memoizedUpdate = memoize((_id: string) => debounce(update, 1000))
const debouncedUpdate = (id: string, projectRef: string, content: Partial<Content>) =>
  memoizedUpdate(id)(id, projectRef, content)

if (typeof window !== 'undefined') {
  devtools(sqlEditorState, { name: 'sqlEditorState', enabled: true })

  subscribe(sqlEditorState.needsSaving, () => {
    const state = getSqlEditorStateSnapshot()

    state.needsSaving.forEach((id) => {
      const snippet = state.snippets[id]

      if (snippet) {
        debouncedUpdate(id, snippet.projectRef, {
          content: { ...snippet.snippet.content, content_id: id },
          type: 'sql',
          id,
        })

        sqlEditorState.needsSaving.delete(id)
        sqlEditorState.savingStates[id] = 'UPDATING'
      }
    })
  })
}
