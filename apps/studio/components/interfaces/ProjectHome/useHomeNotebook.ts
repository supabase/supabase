import { useQuery } from '@tanstack/react-query'

import { HOME_NOTEBOOK_NAME } from './Home.utils'
import { notebookByNameQueryOptions } from '@/data/content/notebooks/notebook-by-name-query'
import { useNotebookQuery, type NotebookData } from '@/data/content/notebooks/notebook-query'

type HomeNotebookState =
  | { status: 'pending' }
  | { status: 'error'; error: Error }
  | { status: 'missing' }
  | { status: 'success'; notebook: NotebookData }

/** The project's "Home" notebook: looked up by name, then loaded with its cells. */
export function useHomeNotebook(projectRef: string | undefined): HomeNotebookState {
  const notebookRowQuery = useQuery(
    notebookByNameQueryOptions({ projectRef, name: HOME_NOTEBOOK_NAME })
  )
  const notebookQuery = useNotebookQuery({ projectRef, id: notebookRowQuery.data?.id })

  if (notebookRowQuery.isError) return { status: 'error', error: notebookRowQuery.error }
  if (notebookRowQuery.isPending) return { status: 'pending' }
  if (notebookRowQuery.data === null) return { status: 'missing' }
  if (notebookQuery.isError) return { status: 'error', error: notebookQuery.error }
  if (notebookQuery.isPending) return { status: 'pending' }
  return { status: 'success', notebook: notebookQuery.data }
}
