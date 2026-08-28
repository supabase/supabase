import { Context, Data, Effect, Layer, Schema } from 'effect'

import { NotebookContent, NotebookSummary, type NotebookId } from './notebook.schema'
import { get, handleError, put } from '@/data/fetchers'

export class ListNotebooksError extends Data.TaggedError('ListNotebooksError')<{
  readonly cause: unknown
}> {}

export class GetNotebookError extends Data.TaggedError('GetNotebookError')<{
  readonly cause: unknown
}> {}

export class SaveNotebookError extends Data.TaggedError('SaveNotebookError')<{
  readonly cause: unknown
}> {}

export interface ListNotebooksParams {
  readonly projectRef: string
  readonly search: string
  readonly favoritesOnly: boolean
  readonly cursor: string | undefined
  readonly limit: number
}

export interface ListNotebooksPage {
  readonly items: ReadonlyArray<NotebookSummary>
  readonly nextCursor: string | undefined
}

export interface GetNotebookParams {
  readonly projectRef: string
  readonly id: NotebookId
}

export interface NotebookRecord {
  readonly name: string
  readonly content: NotebookContent
}

export interface SaveNotebookParams {
  readonly projectRef: string
  readonly id: NotebookId
  readonly name: string
  readonly content: NotebookContent
}

export class NotebooksApi extends Context.Service<
  NotebooksApi,
  {
    readonly list: (
      params: ListNotebooksParams
    ) => Effect.Effect<ListNotebooksPage, ListNotebooksError>
    readonly get: (params: GetNotebookParams) => Effect.Effect<NotebookRecord, GetNotebookError>
    readonly save: (params: SaveNotebookParams) => Effect.Effect<void, SaveNotebookError>
  }
>()('studio/domain/notebooks/NotebooksApi') {}

const decodeNotebookSummary = Schema.decodeUnknownSync(NotebookSummary)
const decodeNotebookContent = Schema.decodeUnknownSync(NotebookContent)
const decodeNotebookName = Schema.decodeUnknownSync(Schema.String)

export const NotebooksApiLive = Layer.succeed(NotebooksApi, {
  list: ({ projectRef, search, favoritesOnly, cursor, limit }) =>
    Effect.tryPromise({
      try: async (signal) => {
        const { data, error } = await get('/platform/projects/{ref}/content', {
          params: {
            path: { ref: projectRef },
            query: {
              type: 'notebook',
              name: search === '' ? undefined : search,
              favorite: favoritesOnly ? 'true' : undefined,
              limit: limit.toString(),
              cursor,
            },
          },
          signal,
        })
        if (error) handleError(error)

        return {
          items: data.data.map((item) => decodeNotebookSummary(item)),
          nextCursor: data.cursor,
        }
      },
      catch: (cause) => new ListNotebooksError({ cause }),
    }),

  get: ({ projectRef, id }) =>
    Effect.tryPromise({
      try: async (signal) => {
        const { data, error } = await get('/platform/projects/{ref}/content/item/{id}', {
          params: { path: { ref: projectRef, id } },
          signal,
        })
        if (error) handleError(error)

        return {
          name: decodeNotebookName(data.name),
          content: decodeNotebookContent(data.content),
        }
      },
      catch: (cause) => new GetNotebookError({ cause }),
    }),

  save: ({ projectRef, id, name, content }) =>
    Effect.tryPromise({
      try: async (signal) => {
        const { error } = await put('/platform/projects/{ref}/content', {
          params: { path: { ref: projectRef } },
          body: {
            id,
            name,
            type: 'notebook',
            visibility: 'project',
            content,
          },
          signal,
        })
        if (error) handleError(error)
      },
      catch: (cause) => new SaveNotebookError({ cause }),
    }),
})
