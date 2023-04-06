import { Content } from 'data/content/content-query'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { updateContent } from 'data/content/content-update-mutation'
import { debounce, memoize } from 'lodash'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxySet } from 'valtio/utils'

export const sqlEditorState = proxy({
  snippets: {} as {
    [key: string]: {
      snippet: SqlSnippet
      splitSizes: number[]
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
      sqlEditorState.addSnippet(snippet, projectRef)
    })
  },
  addSnippet: (snippet: SqlSnippet, projectRef: string) => {
    if (snippet.id && !sqlEditorState.snippets[snippet.id]) {
      sqlEditorState.snippets[snippet.id] = {
        snippet,
        splitSizes: [50, 50],
        projectRef,
      }
      sqlEditorState.results[snippet.id] = []
      sqlEditorState.savingStates[snippet.id] = 'IDLE'
    }
    sqlEditorState.loaded[projectRef] = true
  },
  removeSnippet: (id: string) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults
  },
  setSplitSizes: (id: string, splitSizes: number[]) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].splitSizes = splitSizes
    }
  },
  collapseUtilityPanel: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].splitSizes = [100, 0]
    }
  },
  restoreUtilityPanel: (id: string) => {
    if (sqlEditorState.snippets[id]) {
      sqlEditorState.snippets[id].splitSizes = [50, 50]
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
    sqlEditorState.savingStates[id] = 'UPDATING'
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
      }
    })
  })
}
