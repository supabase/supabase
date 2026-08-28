import { Effect, Option } from 'effect'
import { AsyncResult, Atom, type AtomRegistry } from 'effect/unstable/reactivity'

import * as Cells from './notebook.cells'
import { Cell, CellId, NotebookContent, NotebookId } from './notebook.schema'
import { NotebooksApi } from './notebooks.api'
import { notebookPageStream } from './notebooks.list'
import { notebooksRuntime } from './notebooks.runtime'

export const notebookSearchAtom = Atom.make('')
export const notebookFavoritesOnlyAtom = Atom.make(false)

export type NotebookStatus = 'new' | 'unsaved' | 'saved'

/**
 * Runs an effect that needs `NotebooksApi` against the runtime's resolved
 * context. `runtime.pull`/`runtime.atom` do this reactively; imperative
 * actions (load one notebook, save it) need the same context but outside a
 * read function, so they pull it out of the runtime atom's current value.
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

  /** `undefined` means "not yet created locally or loaded from the server". */
  const contentAtom = Atom.family((_id: NotebookId) =>
    Atom.make<NotebookContent | undefined>(undefined)
  )
  const hasBeenPersistedAtom = Atom.family((_id: NotebookId) => Atom.make(false))
  const dirtyAtom = Atom.family((_id: NotebookId) => Atom.make(false))

  const statusAtom = Atom.family((id: NotebookId) =>
    Atom.readable(
      (get): NotebookStatus =>
        !get(hasBeenPersistedAtom(id)) ? 'new' : get(dirtyAtom(id)) ? 'unsaved' : 'saved'
    )
  )

  const createLocalNotebook = (registry: AtomRegistry.AtomRegistry): NotebookId => {
    const id = NotebookId.make(crypto.randomUUID())
    registry.set(contentAtom(id), { cells: [] })
    registry.set(hasBeenPersistedAtom(id), false)
    return id
  }

  /** Fetches a notebook known to exist server-side. No-ops if already loaded. */
  const loadNotebook = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId
  ): Promise<void> => {
    if (registry.get(contentAtom(id)) !== undefined) return Promise.resolve()

    return runWithRuntime(
      runtime,
      registry,
      Effect.gen(function* () {
        const api = yield* NotebooksApi
        return yield* api.get({ projectRef, id })
      })
    ).then((content) => {
      registry.set(contentAtom(id), content)
      registry.set(hasBeenPersistedAtom(id), true)
    })
  }

  const mutateCells = (
    registry: AtomRegistry.AtomRegistry,
    id: NotebookId,
    updateCells: (cells: ReadonlyArray<Cell>) => ReadonlyArray<Cell>
  ) => {
    const content = registry.get(contentAtom(id))
    if (!content) return

    registry.set(contentAtom(id), { ...content, cells: updateCells(content.cells) })
    registry.set(dirtyAtom(id), true)
  }

  const insertCellAfter = (
    registry: AtomRegistry.AtomRegistry,
    id: NotebookId,
    afterId: Option.Option<CellId>,
    cell: Cell
  ) => mutateCells(registry, id, (cells) => Cells.insertCellAfter(cells, afterId, cell))

  const removeCell = (registry: AtomRegistry.AtomRegistry, id: NotebookId, cellId: CellId) =>
    mutateCells(registry, id, (cells) => Cells.removeCell(cells, cellId))

  const updateCell = (
    registry: AtomRegistry.AtomRegistry,
    id: NotebookId,
    cellId: CellId,
    updater: (cell: Cell) => Cell
  ) => mutateCells(registry, id, (cells) => Cells.updateCell(cells, cellId, updater))

  const moveCell = (
    registry: AtomRegistry.AtomRegistry,
    id: NotebookId,
    cellId: CellId,
    direction: 'up' | 'down'
  ) => mutateCells(registry, id, (cells) => Cells.moveCell(cells, cellId, direction))

  const reorderCells = (
    registry: AtomRegistry.AtomRegistry,
    id: NotebookId,
    activeId: CellId,
    overId: CellId
  ) => mutateCells(registry, id, (cells) => Cells.reorderCells(cells, activeId, overId))

  const saveNotebook = (
    registry: AtomRegistry.AtomRegistry,
    projectRef: string,
    id: NotebookId,
    name: string
  ): Promise<void> => {
    const content = registry.get(contentAtom(id))
    if (!content) return Promise.resolve()

    return runWithRuntime(
      runtime,
      registry,
      Effect.gen(function* () {
        const api = yield* NotebooksApi
        yield* api.save({ projectRef, id, name, content })
      })
    ).then(() => {
      registry.set(dirtyAtom(id), false)
      registry.set(hasBeenPersistedAtom(id), true)
    })
  }

  return {
    notebooksAtom,
    loadMoreNotebooks,
    canLoadMoreAtom,
    contentAtom,
    dirtyAtom,
    statusAtom,
    createLocalNotebook,
    loadNotebook,
    insertCellAfter,
    removeCell,
    updateCell,
    moveCell,
    reorderCells,
    saveNotebook,
  } as const
}

export const notebooksAtoms = makeNotebooksAtoms(notebooksRuntime)
