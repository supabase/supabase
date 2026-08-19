import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'

import type { ContentOfType } from '../content-query'
import { contentKeys } from '../keys'
import {
  createMarkdownCellSkeleton,
  createQueryCellSkeleton,
} from '@/components/interfaces/Explorer/utils'
import { timeout } from '@/lib/helpers'
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

/**
 * [Joshen] These are temporary stubs until API support for notebooks is ready
 * Fabricates data locally instead of calling the real endpoint. Once API is ready,
 * refer to commented out code at the bottom of this file for proper implementation
 */

const STUB_OWNER = { id: 1, username: 'you' }
const STUB_TIMESTAMP = '2024-01-01T00:00:00.000Z'
export const STUB_NOTEBOOKS: NotebookRow[] = [
  {
    id: 'stub-notebook-signup-funnel',
    type: 'notebook',
    name: 'Signup funnel',
    description: '',
    favorite: false,
    folder_id: null,
    inserted_at: STUB_TIMESTAMP,
    updated_at: STUB_TIMESTAMP,
    visibility: 'project',
    owner_id: STUB_OWNER.id,
    project_id: 0,
    owner: STUB_OWNER,
    updated_by: STUB_OWNER,
    content: {
      schema_version: 1,
      cells: [
        createMarkdownCellSkeleton({
          content: '# Signup funnel\nTrack how many users complete each step of sign up.',
        }),
        createQueryCellSkeleton({
          sql: 'select * from auth.users order by created_at desc limit 20;',
        }),
      ],
    },
  },
  {
    id: 'stub-notebook-error-rates',
    type: 'notebook',
    name: 'Error rate investigation',
    description: '',
    favorite: false,
    folder_id: null,
    inserted_at: STUB_TIMESTAMP,
    updated_at: STUB_TIMESTAMP,
    visibility: 'project',
    owner_id: STUB_OWNER.id,
    project_id: 0,
    owner: STUB_OWNER,
    updated_by: STUB_OWNER,
    content: {
      schema_version: 1,
      cells: [
        createMarkdownCellSkeleton({
          content: '# Error rate investigation\nNotes on the recent spike in 5xx responses.',
        }),
        createQueryCellSkeleton({ sql: 'select count(*) from pg_stat_activity;' }),
      ],
    },
  },
]

async function getStubNotebooks({ limit = 10 }: NotebooksVariables): Promise<NotebooksPage> {
  const rows = STUB_NOTEBOOKS

  await timeout(1000)
  return { cursor: undefined, content: rows.slice(0, limit) }
}

export const useNotebooksInfiniteQuery = (
  { projectRef, name, limit, sort }: NotebooksVariables,
  options: UseCustomInfiniteQueryOptions<
    NotebooksPage,
    unknown,
    InfiniteData<NotebooksPage>,
    ReadonlyArray<unknown>,
    string | undefined
  > = {}
) => {
  const { enabled = true, ...restOptions } = options

  return useInfiniteQuery({
    queryKey: contentKeys.infiniteList(projectRef, { type: 'notebook', name, limit, sort }),
    queryFn: () => getStubNotebooks({ limit }),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
    ...restOptions,
  })
}

// [Joshen] The following is all we need for this hook once the API is hooked up
// export const useNotebooksInfiniteQuery = (
//   { projectRef, name, limit, sort }: NotebooksVariables,
//   options: Omit<
//     UseCustomInfiniteQueryOptions<
//       ContentData,
//       ContentError,
//       InfiniteData<NotebooksPage>,
//       ReadonlyArray<unknown>,
//       string | undefined
//     >,
//     'select'
//   > = {}
// ) =>
//   useContentInfiniteQuery<NotebooksPage>(
//     { projectRef, type: 'notebook', name, limit, sort },
//     {
//       ...options,
//       select: (data) => ({
//         ...data,
//         pages: data.pages.map((page) => ({ ...page, content: page.content as NotebookRow[] })),
//       }),
//     }
//   )
