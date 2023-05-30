import { createContent } from 'data/content/content-create-mutation'
import { Content } from 'data/content/content-query'
import { updateContent } from 'data/content/content-update-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { debounce, memoize } from 'lodash'
import { useMemo } from 'react'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { devtools, proxySet } from 'valtio/utils'

export type StateSnippet = {
  snippet: SqlSnippet
  splitSizes: number[]
  projectRef: string
}

export const sqlEditorState = proxy({
  snippets: {} as {
    [key: string]: StateSnippet
  },
  results: {} as {
    [key: string]: {
      rows: any[]
      error?: any
    }[]
  },
  // Project ref as the key, ids of each snippet as the order
  orders: {} as {
    [key: string]: string[]
  },
  loaded: {} as {
    [key: string]: boolean
  },

  needsCreating: proxySet<string>([]),
  needsSaving: proxySet<string>([]),
  savingStates: {} as {
    [key: string]: 'IDLE' | 'UPDATING' | 'UPDATING_FAILED'
  },

  orderSnippets: (snippets: SqlSnippet[]) => {
    return (
      snippets
        .filter((s) => Boolean(s.id))
        // first alphabetical
        .sort((a, b) => a.name?.localeCompare(b.name))
    )
  },
  reorderSnippets: (projectRef: string) => {
    sqlEditorState.orders[projectRef] = sqlEditorState
      .orderSnippets(
        sqlEditorState.orders[projectRef].map((id) => sqlEditorState.snippets[id].snippet)
      )
      .map((s) => s.id!)
  },

  setRemoteSnippets: (snippets: SqlSnippet[], projectRef: string) => {
    if (!sqlEditorState.orders[projectRef]) {
      const orderedSnippets = sqlEditorState.orderSnippets(snippets)

      sqlEditorState.orders[projectRef] = orderedSnippets.map((s) => s.id!)
    }

    snippets.forEach((snippet) => {
      sqlEditorState.addSnippet(snippet, projectRef)
    })
  },
  addSnippet: (snippet: SqlSnippet, projectRef: string, isNew?: boolean) => {
    if (snippet.id && !sqlEditorState.snippets[snippet.id]) {
      sqlEditorState.snippets[snippet.id] = {
        snippet,
        splitSizes: [50, 50],
        projectRef,
      }
      sqlEditorState.results[snippet.id] = []
      sqlEditorState.savingStates[snippet.id] = 'IDLE'
      if (
        sqlEditorState.orders[projectRef] !== undefined &&
        !sqlEditorState.orders[projectRef].includes(snippet.id)
      ) {
        sqlEditorState.orders[projectRef].unshift(snippet.id)
        sqlEditorState.reorderSnippets(projectRef)
      }
      if (isNew) {
        sqlEditorState.needsCreating.add(snippet.id)
      }
    }
    sqlEditorState.loaded[projectRef] = true
  },
  removeSnippet: (id: string) => {
    const { [id]: snippet, ...otherSnippets } = sqlEditorState.snippets
    sqlEditorState.snippets = otherSnippets

    const { [id]: result, ...otherResults } = sqlEditorState.results
    sqlEditorState.results = otherResults

    sqlEditorState.orders[snippet.projectRef] = sqlEditorState.orders[snippet.projectRef].filter(
      (s) => s !== id
    )

    sqlEditorState.needsSaving.delete(id)
    sqlEditorState.needsCreating.delete(id)
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
  renameSnippet: (id: string, name: string, description?: string) => {
    if (sqlEditorState.snippets[id]) {
      const { snippet, projectRef } = sqlEditorState.snippets[id]

      snippet.name = name
      snippet.description = description

      sqlEditorState.reorderSnippets(projectRef)
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

export const useSnippets = (projectRef: string | undefined) => {
  const snapshot = useSqlEditorStateSnapshot()

  return useMemo(() => {
    return projectRef
      ? snapshot.orders[projectRef]?.map((id) => snapshot.snippets[id].snippet) ?? []
      : []
  }, [projectRef, snapshot.orders, snapshot.snippets])
}

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

  subscribe(sqlEditorState.needsCreating, () => {
    const state = getSqlEditorStateSnapshot()

    state.needsCreating.forEach((id) => {
      const snippet = state.snippets[id]

      if (snippet) {
        sqlEditorState.savingStates[id] = 'UPDATING'
        createContent({
          projectRef: snippet.projectRef,
          payload: {
            ...snippet.snippet,
            type: 'sql',
          },
        })
          .then(() => {
            sqlEditorState.savingStates[id] = 'IDLE'
            sqlEditorState.needsCreating.delete(id)
          })
          .catch(() => {
            sqlEditorState.savingStates[id] = 'UPDATING_FAILED'
          })
      }
    })
  })

  subscribe(sqlEditorState.needsSaving, () => {
    const state = getSqlEditorStateSnapshot()

    Array.from(state.needsSaving)
      .filter((id) => !state.needsCreating.has(id))
      .forEach((id) => {
        const snippet = state.snippets[id]

        if (snippet) {
          debouncedUpdate(id, snippet.projectRef, {
            content: { ...snippet.snippet.content, content_id: id },
            type: 'sql',
            id,
            name: snippet.snippet.name,
            description: snippet.snippet.description,
          })

          sqlEditorState.needsSaving.delete(id)
        }
      })
  })
}
