import { Effect, Layer, Option } from 'effect'
import { Atom, AtomRegistry } from 'effect/unstable/reactivity'
import { afterEach, describe, expect, it } from 'vitest'

import { CellId, NotebookId, type NotebookContent } from './notebook.schema'
import {
  ListNotebooksError,
  NotebooksApi,
  type GetNotebookError,
  type GetNotebookParams,
  type ListNotebooksPage,
  type ListNotebooksParams,
  type SaveNotebookError,
  type SaveNotebookParams,
} from './notebooks.api'
import { makeNotebooksAtoms } from './notebooks.atoms'
import { waitFor } from '@/tests/lib/atom-test-utils'

const summary = (id: string) => ({ id: NotebookId.make(id), name: id, favorite: false })

const registries: Array<AtomRegistry.AtomRegistry> = []

afterEach(() => {
  registries.splice(0).forEach((registry) => registry.dispose())
})

const setup = (
  overrides: Partial<{
    list: (params: ListNotebooksParams) => Effect.Effect<ListNotebooksPage, ListNotebooksError>
    get: (params: GetNotebookParams) => Effect.Effect<NotebookContent, GetNotebookError>
    save: (params: SaveNotebookParams) => Effect.Effect<void, SaveNotebookError>
  }> = {}
) => {
  const layer = Layer.succeed(NotebooksApi, {
    list: overrides.list ?? (() => Effect.succeed({ items: [], nextCursor: undefined })),
    get: overrides.get ?? (() => Effect.die('get not stubbed')),
    save: overrides.save ?? (() => Effect.succeed(void 0)),
  })
  const runtime = Atom.runtime(layer)
  const registry = AtomRegistry.make()
  registries.push(registry)
  const atoms = makeNotebooksAtoms(runtime)
  return { registry, atoms }
}

describe('createLocalNotebook', () => {
  it('creates an empty, non-dirty, "new" notebook', () => {
    const { registry, atoms } = setup()
    const id = atoms.createLocalNotebook(registry)

    expect(registry.get(atoms.contentAtom(id))).toEqual({ cells: [] })
    expect(registry.get(atoms.dirtyAtom(id))).toBe(false)
    expect(registry.get(atoms.statusAtom(id))).toBe('new')
  })
})

describe('cell mutations', () => {
  it('mark the notebook dirty without changing its "new" status', () => {
    const { registry, atoms } = setup()
    const id = atoms.createLocalNotebook(registry)

    atoms.insertCellAfter(registry, id, Option.none(), {
      _tag: 'markdown_cell',
      _id: CellId.make('cell-1'),
      source: 'hello',
    })

    expect(registry.get(atoms.contentAtom(id))?.cells).toHaveLength(1)
    expect(registry.get(atoms.dirtyAtom(id))).toBe(true)
    expect(registry.get(atoms.statusAtom(id))).toBe('new')
  })

  it('are no-ops when the notebook has no loaded content', () => {
    const { registry, atoms } = setup()
    const id = NotebookId.make('unloaded')

    atoms.removeCell(registry, id, CellId.make('missing'))

    expect(registry.get(atoms.contentAtom(id))).toBeUndefined()
    expect(registry.get(atoms.dirtyAtom(id))).toBe(false)
  })
})

describe('saveNotebook', () => {
  it('clears dirty and flips status to "saved" on success', async () => {
    const { registry, atoms } = setup()
    const id = atoms.createLocalNotebook(registry)
    atoms.insertCellAfter(registry, id, Option.none(), {
      _tag: 'markdown_cell',
      _id: CellId.make('cell-1'),
      source: 'hello',
    })
    expect(registry.get(atoms.dirtyAtom(id))).toBe(true)

    await atoms.saveNotebook(registry, 'project-ref', id, 'My notebook')

    expect(registry.get(atoms.dirtyAtom(id))).toBe(false)
    expect(registry.get(atoms.statusAtom(id))).toBe('saved')
  })

  it('makes no API call and stays non-dirty when the notebook has no loaded content', async () => {
    let calls = 0
    const { registry, atoms } = setup({
      save: () => {
        calls += 1
        return Effect.succeed(void 0)
      },
    })
    const id = NotebookId.make('unloaded')

    await atoms.saveNotebook(registry, 'project-ref', id, 'name')

    expect(calls).toBe(0)
    expect(registry.get(atoms.dirtyAtom(id))).toBe(false)
  })
})

describe('loadNotebook', () => {
  it('loads content from the API and marks the notebook persisted', async () => {
    const { registry, atoms } = setup({
      get: () => Effect.succeed({ cells: [] }),
    })
    const id = NotebookId.make('server-id')

    await atoms.loadNotebook(registry, 'project-ref', id)

    expect(registry.get(atoms.contentAtom(id))).toEqual({ cells: [] })
    expect(registry.get(atoms.statusAtom(id))).toBe('saved')
  })

  it('does not refetch a notebook that is already loaded', async () => {
    let calls = 0
    const { registry, atoms } = setup({
      get: () => {
        calls += 1
        return Effect.succeed({ cells: [] })
      },
    })
    const id = NotebookId.make('server-id')

    await atoms.loadNotebook(registry, 'project-ref', id)
    await atoms.loadNotebook(registry, 'project-ref', id)

    expect(calls).toBe(1)
  })
})

describe('notebooksAtom', () => {
  it('starts in the Initial state before the first page resolves', () => {
    const { registry, atoms } = setup({
      list: () => Effect.promise(() => new Promise<ListNotebooksPage>(() => {})),
    })

    expect(registry.get(atoms.notebooksAtom('project-ref'))._tag).toBe('Initial')
  })

  it('accumulates items across successive loadMoreNotebooks calls', async () => {
    const pages: ReadonlyArray<ListNotebooksPage> = [
      { items: [summary('a')], nextCursor: 'page-2' },
      { items: [summary('b')], nextCursor: undefined },
    ]
    let call = 0
    const { registry, atoms } = setup({
      list: () => Effect.succeed(pages[call++] ?? { items: [], nextCursor: undefined }),
    })

    const result = await waitFor(
      registry,
      atoms.notebooksAtom('project-ref'),
      (r) => r._tag === 'Success'
    )
    expect(result._tag === 'Success' && result.value.items.map((i) => i.id)).toEqual(['a'])

    atoms.loadMoreNotebooks(registry, 'project-ref')

    const next = await waitFor(
      registry,
      atoms.notebooksAtom('project-ref'),
      (r) => r._tag === 'Success' && r.value.items.length === 2
    )
    expect(next._tag === 'Success' && next.value.items.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('keeps showing the previous page, marked as waiting, while the next page is in flight', async () => {
    let resolveSecondPage!: (page: ListNotebooksPage) => void
    const secondPage = new Promise<ListNotebooksPage>((resolve) => {
      resolveSecondPage = resolve
    })
    let call = 0
    const { registry, atoms } = setup({
      list: () =>
        call++ === 0
          ? Effect.succeed({ items: [summary('a')], nextCursor: 'page-2' })
          : Effect.promise(() => secondPage),
    })

    await waitFor(registry, atoms.notebooksAtom('project-ref'), (r) => r._tag === 'Success')
    atoms.loadMoreNotebooks(registry, 'project-ref')

    const whileLoading = registry.get(atoms.notebooksAtom('project-ref'))
    expect(whileLoading._tag).toBe('Success')
    expect(whileLoading.waiting).toBe(true)
    expect(whileLoading._tag === 'Success' && whileLoading.value.items.map((i) => i.id)).toEqual([
      'a',
    ])

    resolveSecondPage({ items: [summary('b')], nextCursor: undefined })

    const done = await waitFor(
      registry,
      atoms.notebooksAtom('project-ref'),
      (r) => r._tag === 'Success' && r.value.items.length === 2
    )
    expect(done._tag === 'Success' && done.value.items.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('surfaces a failure from the first page', async () => {
    const { registry, atoms } = setup({
      list: () => Effect.fail(new ListNotebooksError({ cause: 'boom' })),
    })

    const result = await waitFor(
      registry,
      atoms.notebooksAtom('project-ref'),
      (r) => r._tag === 'Failure'
    )
    expect(result._tag).toBe('Failure')
  })

  it('preserves the last successful page as previousSuccess when a later page fails', async () => {
    let call = 0
    const { registry, atoms } = setup({
      list: () =>
        call++ === 0
          ? Effect.succeed({ items: [summary('a')], nextCursor: 'page-2' })
          : Effect.fail(new ListNotebooksError({ cause: 'boom' })),
    })

    await waitFor(registry, atoms.notebooksAtom('project-ref'), (r) => r._tag === 'Success')
    atoms.loadMoreNotebooks(registry, 'project-ref')

    const failed = await waitFor(
      registry,
      atoms.notebooksAtom('project-ref'),
      (r) => r._tag === 'Failure'
    )
    expect(failed._tag).toBe('Failure')
    const previousItems =
      failed._tag === 'Failure' &&
      Option.isSome(failed.previousSuccess) &&
      failed.previousSuccess.value.value.items.map((i) => i.id)
    expect(previousItems).toEqual(['a'])
  })
})

describe('canLoadMoreAtom', () => {
  it('is false before the first page resolves', () => {
    const { registry, atoms } = setup({
      list: () => Effect.promise(() => new Promise<ListNotebooksPage>(() => {})),
    })

    expect(registry.get(atoms.canLoadMoreAtom('project-ref'))).toBe(false)
  })

  it('is true once a page resolves with more to load', async () => {
    const { registry, atoms } = setup({
      list: () => Effect.succeed({ items: [summary('a')], nextCursor: 'page-2' }),
    })

    await waitFor(registry, atoms.notebooksAtom('project-ref'), (r) => r._tag === 'Success')

    expect(registry.get(atoms.canLoadMoreAtom('project-ref'))).toBe(true)
  })

  it('is still true right after the last page loads — exhaustion is only confirmed by the next pull', async () => {
    const { registry, atoms } = setup({
      list: () => Effect.succeed({ items: [summary('a')], nextCursor: undefined }),
    })

    await waitFor(registry, atoms.notebooksAtom('project-ref'), (r) => r._tag === 'Success')

    expect(registry.get(atoms.canLoadMoreAtom('project-ref'))).toBe(true)
  })

  it('becomes false once a further load confirms exhaustion, without losing items or refetching', async () => {
    let calls = 0
    const { registry, atoms } = setup({
      list: () => {
        calls++
        return Effect.succeed({ items: [summary('a')], nextCursor: undefined })
      },
    })

    const results: Array<unknown> = []
    const unsubscribe = registry.subscribe(atoms.notebooksAtom('project-ref'), (r) =>
      results.push(r)
    )

    await waitFor(registry, atoms.notebooksAtom('project-ref'), (r) => r._tag === 'Success')
    atoms.loadMoreNotebooks(registry, 'project-ref')

    const exhausted = await waitFor(
      registry,
      atoms.notebooksAtom('project-ref'),
      (r) => r._tag === 'Success' && r.value.done
    )

    expect(exhausted._tag === 'Success' && exhausted.value.items.map((i) => i.id)).toEqual(['a'])
    expect(registry.get(atoms.canLoadMoreAtom('project-ref'))).toBe(false)
    expect(calls).toBe(1)

    unsubscribe()
  })

  it('is false while the next page is still loading', async () => {
    let resolveSecondPage!: (page: ListNotebooksPage) => void
    const secondPage = new Promise<ListNotebooksPage>((resolve) => {
      resolveSecondPage = resolve
    })
    let call = 0
    const { registry, atoms } = setup({
      list: () =>
        call++ === 0
          ? Effect.succeed({ items: [summary('a')], nextCursor: 'page-2' })
          : Effect.promise(() => secondPage),
    })

    await waitFor(registry, atoms.notebooksAtom('project-ref'), (r) => r._tag === 'Success')
    atoms.loadMoreNotebooks(registry, 'project-ref')

    expect(registry.get(atoms.canLoadMoreAtom('project-ref'))).toBe(false)

    resolveSecondPage({ items: [summary('b')], nextCursor: undefined })
  })
})
