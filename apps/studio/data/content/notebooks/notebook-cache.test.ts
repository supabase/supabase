import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'

import { evictNotebookFromCaches } from './notebook-cache'
import { contentKeys } from '@/data/content/keys'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'

const PROJECT_REF = 'default'
const NOTEBOOK_ID = 'notebook-cache-test'

const NOTEBOOK: Notebook = {
  id: NOTEBOOK_ID,
  type: 'notebook',
  name: 'Test notebook',
  visibility: 'project',
  favorite: false,
  owner_id: 1,
  project_id: 1,
  content: { schema_version: 1, cells: [] },
}

const seedNotebook = (status: 'new' | 'saved') => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  if (status === 'new') {
    notebooksState.addNotebook({ projectRef: PROJECT_REF, notebook: NOTEBOOK })
  } else {
    notebooksState.setNotebook({ projectRef: PROJECT_REF, notebook: NOTEBOOK })
  }
}

const seedQueryData = (queryClient: QueryClient) =>
  queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })

afterEach(() => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  notebooksState.needsSaving.clear()
})

describe('evictNotebookFromCaches', () => {
  it('removes a saved notebook from the store and invalidates its cache entry in "refresh" mode', async () => {
    seedNotebook('saved')
    const queryClient = new QueryClient()
    seedQueryData(queryClient)

    const evicted = await evictNotebookFromCaches({
      queryClient,
      projectRef: PROJECT_REF,
      id: NOTEBOOK_ID,
      mode: 'refresh',
    })

    expect(evicted).toBe(true)
    expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined()
    expect(
      queryClient.getQueryState(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))?.isInvalidated
    ).toBe(true)
  })

  it('removes a saved notebook from the store and drops its cache entry in "remove" mode', async () => {
    seedNotebook('saved')
    const queryClient = new QueryClient()
    seedQueryData(queryClient)

    const evicted = await evictNotebookFromCaches({
      queryClient,
      projectRef: PROJECT_REF,
      id: NOTEBOOK_ID,
      mode: 'remove',
    })

    expect(evicted).toBe(true)
    expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined()
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toBeUndefined()
  })

  it('leaves an unsaved notebook and its cache entry untouched', async () => {
    seedNotebook('new')
    const queryClient = new QueryClient()
    seedQueryData(queryClient)

    const evicted = await evictNotebookFromCaches({
      queryClient,
      projectRef: PROJECT_REF,
      id: NOTEBOOK_ID,
      mode: 'remove',
    })

    expect(evicted).toBe(false)
    expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeDefined()
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toEqual({
      id: NOTEBOOK_ID,
    })
  })

  it('no-ops for an id not present in the store', async () => {
    const queryClient = new QueryClient()
    seedQueryData(queryClient)

    const evicted = await evictNotebookFromCaches({
      queryClient,
      projectRef: PROJECT_REF,
      id: NOTEBOOK_ID,
      mode: 'remove',
    })

    expect(evicted).toBe(false)
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toEqual({
      id: NOTEBOOK_ID,
    })
  })
})
