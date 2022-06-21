import { SqlSnippet } from 'data/sql/useSqlSnippetsQuery'
import { isEmpty } from 'lodash'
import { proxy, subscribe, useSnapshot, snapshot } from 'valtio'
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
  loaded: {} as {
    [key: string]: true
  },
  needsSaving: proxySet<string>([]),
  isSaving: proxySet<string>([]),

  setInitialSnippets: (snippets: SqlSnippet[], projectRef: string) => {
    snippets.forEach((snippet) => {
      if (snippet.id && !sqlEditorState.snippets[snippet.id]) {
        sqlEditorState.snippets[snippet.id] = {
          snippet,
          splitSizes: [50, 50],
          utilityPanelCollapsed: false,
          projectRef,
        }
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
    }
  },
})

export const useSqlEditorStateSnapshot = () => useSnapshot(sqlEditorState)

if (typeof window !== 'undefined') {
  devtools(sqlEditorState, { name: 'sqlEditorState', enabled: true })

  subscribe(sqlEditorState.needsSaving, () => {
    const state = snapshot(sqlEditorState)
    console.log('needs saving state:', state)
  })
}
