import { queryOptions } from '@tanstack/react-query'

import { getContent } from '../content-infinite-query'
import { contentKeys } from '../keys'
import { type NotebookRow } from './notebooks-infinite-query'

export type NotebookByNameVariables = { projectRef?: string; name: string }

const PAGE_SIZE = 50

/** Whether a notebook is named `name`, ignoring case and surrounding whitespace. */
export const isNotebookNamed = (notebook: { name: string }, name: string) =>
  notebook.name.trim().toLowerCase() === name.trim().toLowerCase()

/**
 * The first notebook named `name` (see `isNotebookNamed`), or null if there isn't one. The
 * content API's `name` filter also returns partial matches, so this pages through the
 * filtered list until it finds an exact one.
 */
async function getNotebookByName(
  { projectRef, name }: NotebookByNameVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let cursor: string | undefined
  do {
    const page = await getContent(
      { projectRef, type: 'notebook', name, limit: PAGE_SIZE, cursor },
      signal
    )
    const match = (page.content as NotebookRow[]).find((notebook) =>
      isNotebookNamed(notebook, name)
    )
    if (match) return match
    cursor = page.cursor
  } while (cursor)

  return null
}

export type NotebookByNameData = Awaited<ReturnType<typeof getNotebookByName>>

export const notebookByNameQueryOptions = ({ projectRef, name }: NotebookByNameVariables) =>
  queryOptions({
    queryKey: contentKeys.notebookByName(projectRef, name),
    queryFn: ({ signal }) => getNotebookByName({ projectRef, name }, signal),
    enabled: typeof projectRef !== 'undefined',
  })
