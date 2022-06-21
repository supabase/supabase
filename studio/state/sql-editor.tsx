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
      sqlEditorState.needsSaving.add(id)
    }
  },
})

export const useSqlEditorStateSnapshot = () => useSnapshot(sqlEditorState)

async function update(id: string, projectRef: string, content: Partial<Content>) {
  try {
    await updateContent({ projectRef, id, content })
  } catch (error) {
    // TODO
    console.log('error:', error)
  }

  sqlEditorState.isSaving.delete(id)
}

const memoizedUpdate = memoize((_id: string) => debounce(update, 1000))
const debouncedUpdate = (id: string, projectRef: string, content: Partial<Content>) =>
  memoizedUpdate(id)(id, projectRef, content)

if (typeof window !== 'undefined') {
  devtools(sqlEditorState, { name: 'sqlEditorState', enabled: true })

  subscribe(sqlEditorState.needsSaving, () => {
    const state = snapshot(sqlEditorState)

    state.needsSaving.forEach((id) => {
      const snippet = state.snippets[id]

      if (snippet) {
        debouncedUpdate(id, snippet.projectRef, {
          content: { ...snippet.snippet.content, content_id: id },
          type: 'sql',
          id,
        })

        sqlEditorState.needsSaving.delete(id)
        sqlEditorState.isSaving.add(id)
      }
    })
  })
}
