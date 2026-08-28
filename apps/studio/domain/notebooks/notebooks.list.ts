import { Duration, Effect, Option, Stream } from 'effect'

import type { NotebookSummary } from './notebook.schema'
import { NotebooksApi, type ListNotebooksError } from './notebooks.api'

export const PAGE_SIZE = 50
export const SEARCH_DEBOUNCE = Duration.millis(300)

export interface NotebookListParams {
  readonly projectRef: string
  readonly search: string
  readonly favoritesOnly: boolean
}

/**
 * One chunk per page, cursor threaded through the stream state. `debounce` is
 * a parameter rather than a constant so tests can pass zero and skip the
 * clock entirely when they're testing something else.
 *
 * Only a typed search debounces — switching the favorites filter or the
 * project should feel instant.
 */
export const notebookPageStream = (
  params: NotebookListParams,
  options: { readonly debounce: Duration.Duration } = { debounce: SEARCH_DEBOUNCE }
): Stream.Stream<NotebookSummary, ListNotebooksError, NotebooksApi> => {
  const pages = Stream.paginate(undefined as string | undefined, (cursor) =>
    Effect.gen(function* () {
      const api = yield* NotebooksApi
      const page = yield* api.list({ ...params, cursor, limit: PAGE_SIZE })
      return [page.items, Option.fromUndefinedOr(page.nextCursor)] as const
    })
  )

  return params.search === '' || Duration.isZero(options.debounce)
    ? pages
    : Stream.fromEffect(Effect.sleep(options.debounce)).pipe(Stream.flatMap(() => pages))
}
