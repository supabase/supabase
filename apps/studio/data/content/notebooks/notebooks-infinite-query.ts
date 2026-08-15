import type { InfiniteData } from '@tanstack/react-query'

import {
  useContentInfiniteQuery,
  type ContentData,
  type ContentError,
} from '../content-infinite-query'
import type { ContentOfType } from '../content-query'
import type { UseCustomInfiniteQueryOptions } from '@/types'

export type NotebookRow = ContentOfType<'notebook'>

export interface NotebooksVariables {
  projectRef?: string
  name?: string
  limit?: number
  sort?: 'name' | 'inserted_at'
}

export interface NotebooksPage {
  cursor: string | undefined
  content: NotebookRow[]
}

export const useNotebooksInfiniteQuery = (
  { projectRef, name, limit, sort }: NotebooksVariables,
  options: Omit<
    UseCustomInfiniteQueryOptions<
      ContentData,
      ContentError,
      InfiniteData<NotebooksPage>,
      ReadonlyArray<unknown>,
      string | undefined
    >,
    'select'
  > = {}
) =>
  useContentInfiniteQuery<NotebooksPage>(
    { projectRef, type: 'notebook', name, limit, sort },
    {
      ...options,
      select: (data) => ({
        ...data,
        pages: data.pages.map((page) => ({ ...page, content: page.content as NotebookRow[] })),
      }),
    }
  )
