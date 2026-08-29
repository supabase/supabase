import { Data, Effect, Option } from 'effect'
import { AsyncResult, Atom, type AtomRegistry } from 'effect/unstable/reactivity'

import * as Cells from './notebook.cells'
import { Cell, CellId, NotebookContent, NotebookId } from './notebook.schema'
import { NotebooksApi, type GetNotebookError } from './notebooks.api'
import { notebookPageStream } from './notebooks.list'
import { notebooksRuntime } from './notebooks.runtime'

export const notebookSearchAtom = Atom.make('')
export const notebookFavoritesOnlyAtom = Atom.make(false)

export type NotebookStatus = 'new' | 'unsaved' | 'saved'

/**
 * `Data.Class` gives it structural equality so two calls for the same
 * `(projectRef, id)` are recognized as the same lookup.
 */
export class NotebookCacheKey extends Data.Class<{
  readonly projectRef: string
  readonly id: NotebookId
}> {}

/**
 * Runs an effect that needs `NotebooksApi` against the runtime's resolved
 * context. `runtime.pull`/`runtime.atom` do this reactively; an imperative
 * action like saving a notebook needs the same context but outside a read
 * function, so it pulls it out of the runtime atom's current value.
 */
const runWithRuntime = <A, E>(
  runtime: Atom.AtomRuntime<NotebooksApi>,
  registry: AtomRegistry.AtomRegistry,
  effect: Effect.Effect<A, E, NotebooksApi>
): Promise<A> =>
  AsyncResult.match(registry.get(runtime), {
    onInitial: () => Promise.reject(new Error('NotebooksApi runtime is not ready yet')),
    onFailure: (failure) => Promise.reject(failure.cause),
    onSuccess: (success) => Effect.runPromise(Effect.provide(effect, success.value)),
  })

export const makeNotebooksAtoms = (runtime: Atom.AtomRuntime<NotebooksApi>) => {
  /** Accumulated pages of notebook summaries for a project, keyed by projectRef. */
  const notebooksAtom = Atom.family((projectRef: string) =>
    runtime.pull((get) =>
      notebookPageStream({
        projectRef,
        search: get(notebookSearchAtom).trim(),
        favoritesOnly: get(notebookFavoritesOnlyAtom),
      })
    )
  )

  /**
   * `runtime.pull` treats the write side as "give me the next chunk" rather
   * than "set the value" — the value it writes (`void`) is irrelevant, only
   * the write itself matters, and reading the atom is what drives the
   * initial pull. It accumulates by default because that's the common case
   * for an infinite list (each page appends to what's already loaded); pass
   * `disableAccumulation: true` for a "replace with latest page" cursor
   * instead. Once the underlying stream is exhausted, further writes are
   * no-ops.
   */
  const loadMoreNotebooks = (registry: AtomRegistry.AtomRegistry, projectRef: string) =>
    registry.set(notebooksAtom(projectRef), void 0)

  /** Whether another page can be requested right now — not already loading, not exhausted. */
  const canLoadMoreAtom = Atom.family((projectRef: string) =>
    Atom.readable((get) => {
      const result = get(notebooksAtom(projectRef))
      return AsyncResult.isSuccess(result) && !result.value.done && !result.waiting
    })
  )

  const hasBeenPersistedAtom = Atom.family((_key: NotebookCacheKey) => Atom.make(false))

  /**
   * Reactive load of a single notebook, keyed by `(projectRef, id)`. Exposed
   * as `AsyncResult` so any reader can render Initial/waiting/Success/Failure
   * directly.
   *
   * `Atom.family` memoizes by structural key, so overlapping callers for the
   * same key share one in-flight fetch, and the result is kept once loaded
   * until something explicitly `refresh`es it. Wrapped, rather than exposing
   * `runtime.atom`'s result directly, to flip `hasBeenPersistedAtom(key)` to
   * `true` whenever it settles to `Success`.
   */
  const notebookAtom = Atom.family((key: NotebookCacheKey) => {
    const fetchAtom = runtime.atom(
      Effect.gen(function* () {
        const api = yield* NotebooksApi
        return yield* api.get({ projectRef: key.projectRef, id: key.id })
      })
    )
    return Atom.readable(
      (get) => {
        const result = get(fetchAtom)
        if (AsyncResult.isSuccess(result) && !result.waiting) {
          get.set(hasBeenPersistedAtom(key), true)
        }
        return result
      },
      (refresh) => refresh(fetchAtom)
    )
  })

  const nameAtom = Atom.family((key: NotebookCacheKey) =>
    Atom.readable(
      (get): AsyncResult.AsyncResult<string, GetNotebookError> =>
        AsyncResult.map(get(notebookAtom(key)), (record) => record.name),
      (refresh) => refresh(notebookAtom(key))
    )
  )

  /**
   * Local edits layered on top of whatever `notebookAtom` loaded. `undefined`
   * means "no local edits yet" — read `resolvedContentAtom` for the effective
   * content. Reading this atom never triggers a fetch.
   */
  const contentOverwriteAtom = Atom.family((_key: NotebookCacheKey) =>
    Atom.make<NotebookContent | undefined>(undefined)
  )

  /**
   * The effective content, exposed as `AsyncResult` so a reader can render
   * Initial/waiting/Success/Failure directly instead of collapsing the load
   * state to a bare value. Local edits, once present, are reported as an
   * immediate `Success`; otherwise this mirrors whatever `notebookAtom(key)`
   * is doing. Reading it — like `notebookAtom` — kicks off a fetch if
   * nothing is known yet, so it's meant for reactive display
   * (`useAtomValue`), not for imperative "is there content" checks; those
   * should use {@link getKnownContent} instead to stay side-effect-free.
   */
  const resolvedContentAtom = Atom.family((key: NotebookCacheKey) =>
    Atom.readable((get): AsyncResult.AsyncResult<NotebookContent, GetNotebookError> => {
      const override = get(contentOverwriteAtom(key))
      if (override !== undefined) return AsyncResult.success(override)
      return AsyncResult.map(get(notebookAtom(key)), (record) => record.content)
    })
  )

  const dirtyAtom = Atom.family((_key: NotebookCacheKey) => Atom.make(false))

  const statusAtom = Atom.family((key: NotebookCacheKey) =>
    Atom.readable((get): NotebookStatus | undefined => {
      if (get(hasBeenPersistedAtom(key))) return get(dirtyAtom(key)) ? 'unsaved' : 'saved'
      return get(contentOverwriteAtom(key)) !== undefined ? 'new' : undefined
    })
  )

  /**
   * Reads content for `key` without ever triggering a fetch: `undefined`
   * unless a local notebook was created, edited, or already loaded/saved.
   * `hasBeenPersistedAtom(key)` only ever becomes `true` as a side effect of
   * `notebookAtom(key)` settling to `Success`, so once it's true here,
   * `notebookAtom(key)` is guaranteed to already be mounted and settled — and
   * reading `resolvedContentAtom` right after can't kick off a new fetch
   * either.
   */
  const getKnownContent = (
    registry: AtomRegistry.AtomRegistry,
    key: NotebookCacheKey
  ): NotebookContent | undefined => {
    const override = registry.get(contentOverwriteAtom(key))
    if (override !== undefined) return override
    if (!registry.get(hasBeenPersistedAtom(key))) return undefined

    const result = registry.get(resolvedContentAtom(key))
    return AsyncResult.isSuccess(result) ? result.value : undefined
  }

  const createLocalNotebook = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string
  ): NotebookId => {
    const id = NotebookId.make(crypto.randomUUID())
    const key = new NotebookCacheKey({ projectRef, id })
    registry.set(contentOverwriteAtom(key), { cells: [] })
    return id
  }

  const mutateCells = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    updateCells: (cells: ReadonlyArray<Cell>) => ReadonlyArray<Cell>
  ) => {
    const key = new NotebookCacheKey({ projectRef, id })
    const content = getKnownContent(registry, key)
    if (!content) return

    registry.set(contentOverwriteAtom(key), { ...content, cells: updateCells(content.cells) })
    registry.set(dirtyAtom(key), true)
  }

  const insertCellAfter = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    afterId: Option.Option<CellId>,
    cell: Cell
  ) => mutateCells(registry, projectRef, id, (cells) => Cells.insertCellAfter(cells, afterId, cell))

  const removeCell = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    cellId: CellId
  ) => mutateCells(registry, projectRef, id, (cells) => Cells.removeCell(cells, cellId))

  const updateCell = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    cellId: CellId,
    updater: (cell: Cell) => Cell
  ) => mutateCells(registry, projectRef, id, (cells) => Cells.updateCell(cells, cellId, updater))

  const moveCell = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    cellId: CellId,
    direction: 'up' | 'down'
  ) => mutateCells(registry, projectRef, id, (cells) => Cells.moveCell(cells, cellId, direction))

  const reorderCells = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    activeId: CellId,
    overId: CellId
  ) => mutateCells(registry, projectRef, id, (cells) => Cells.reorderCells(cells, activeId, overId))

  /**
   * Saves the notebook.
   *
   * Separately, only clears `dirtyAtom` if `contentOverwriteAtom` still
   * reference-equals the `content` captured above. `mutateCells` always
   * produces a new object, so if an edit lands between that capture and the
   * `save` call resolving, this correctly leaves dirty `true` — that edit
   * was never sent to the server.
   */
  const saveNotebook = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    name: string
  ): Promise<void> => {
    const key = new NotebookCacheKey({ projectRef, id })
    const content = getKnownContent(registry, key)
    if (!content) return Promise.resolve()

    return runWithRuntime(
      runtime,
      registry,
      Effect.gen(function* () {
        const api = yield* NotebooksApi
        yield* api.save({ projectRef, id, name, content })
      })
    ).then(() => {
      if (registry.get(contentOverwriteAtom(key)) === content) {
        registry.set(dirtyAtom(key), false)
      }
      registry.set(hasBeenPersistedAtom(key), true)
    })
  }

  return {
    notebooksAtom,
    loadMoreNotebooks,
    canLoadMoreAtom,
    nameAtom,
    resolvedContentAtom,
    dirtyAtom,
    statusAtom,
    createLocalNotebook,
    insertCellAfter,
    removeCell,
    updateCell,
    moveCell,
    reorderCells,
    saveNotebook,
  } as const
}

export const notebooksAtoms = makeNotebooksAtoms(notebooksRuntime)
