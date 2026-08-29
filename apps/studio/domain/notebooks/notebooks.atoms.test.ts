import { Effect, Layer, Option } from 'effect'
import { Atom, AtomRegistry } from 'effect/unstable/reactivity'
import { afterEach, describe, expect, it } from 'vitest'

import { CellId, NotebookId } from './notebook.schema'
import {
  GetNotebookError,
  ListNotebooksError,
  NotebooksApi,
  type GetNotebookParams,
  type ListNotebooksPage,
  type ListNotebooksParams,
  type NotebookRecord,
  type SaveNotebookError,
  type SaveNotebookParams,
} from './notebooks.api'
import { makeNotebooksAtoms, NotebookCacheKey } from './notebooks.atoms'
import { waitFor } from '@/tests/lib/atom-test-utils'

const PROJECT_REF = 'project-ref'
const key = (id: NotebookId) => new NotebookCacheKey({ projectRef: PROJECT_REF, id })
const summary = (id: string) => ({ id: NotebookId.make(id), name: id, favorite: false })

const registries: Array<AtomRegistry.AtomRegistry> = []

afterEach(() => {
  registries.splice(0).forEach((registry) => registry.dispose())
})

const setup = (
  overrides: Partial<{
    list: (params: ListNotebooksParams) => Effect.Effect<ListNotebooksPage, ListNotebooksError>
    get: (params: GetNotebookParams) => Effect.Effect<NotebookRecord, GetNotebookError>
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
    const id = atoms.createLocalNotebook(registry, PROJECT_REF)

    const content = registry.get(atoms.resolvedContentAtom(key(id)))
    expect(content._tag === 'Success' && content.value).toEqual({ cells: [] })
    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(false)
    expect(registry.get(atoms.statusAtom(key(id)))).toBe('new')
  })
})

describe('cell mutations', () => {
  it('mark the notebook dirty without changing its "new" status', () => {
    const { registry, atoms } = setup()
    const id = atoms.createLocalNotebook(registry, PROJECT_REF)

    atoms.insertCellAfter(registry, PROJECT_REF, id, Option.none(), {
      _tag: 'markdown_cell',
      _id: CellId.make('cell-1'),
      source: 'hello',
    })

    const content = registry.get(atoms.resolvedContentAtom(key(id)))
    expect(content._tag === 'Success' && content.value.cells).toHaveLength(1)
    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(true)
    expect(registry.get(atoms.statusAtom(key(id)))).toBe('new')
  })

  it('are no-ops when the notebook has no loaded content', () => {
    const { registry, atoms } = setup()
    const id = NotebookId.make('unloaded')

    atoms.removeCell(registry, PROJECT_REF, id, CellId.make('missing'))

    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(false)
  })
})

describe('saveNotebook', () => {
  it('clears dirty and flips status to "saved" on success', async () => {
    const { registry, atoms } = setup()
    const id = atoms.createLocalNotebook(registry, PROJECT_REF)
    atoms.insertCellAfter(registry, PROJECT_REF, id, Option.none(), {
      _tag: 'markdown_cell',
      _id: CellId.make('cell-1'),
      source: 'hello',
    })
    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(true)

    await atoms.saveNotebook(registry, PROJECT_REF, id, 'My notebook')

    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(false)
    expect(registry.get(atoms.statusAtom(key(id)))).toBe('saved')
  })

  it("keeps dirty when an edit lands before the save's PUT resolves", async () => {
    const { registry, atoms } = setup()
    const id = atoms.createLocalNotebook(registry, PROJECT_REF)
    atoms.insertCellAfter(registry, PROJECT_REF, id, Option.none(), {
      _tag: 'markdown_cell',
      _id: CellId.make('cell-1'),
      source: 'hello',
    })

    const savePromise = atoms.saveNotebook(registry, PROJECT_REF, id, 'My notebook')

    // Lands before `saveNotebook`'s own `.then()` runs, since `Effect.runPromise`
    // always resolves as a microtask even for a synchronous effect like `save` here.
    atoms.insertCellAfter(registry, PROJECT_REF, id, Option.none(), {
      _tag: 'markdown_cell',
      _id: CellId.make('cell-2'),
      source: 'world',
    })
    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(true)

    await savePromise

    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(true)
    const content = registry.get(atoms.resolvedContentAtom(key(id)))
    expect(content._tag === 'Success' && content.value.cells).toHaveLength(2)
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

    await atoms.saveNotebook(registry, PROJECT_REF, id, 'name')

    expect(calls).toBe(0)
    expect(registry.get(atoms.dirtyAtom(key(id)))).toBe(false)
  })
})

describe('nameAtom', () => {
  it('loads content and name from the API', async () => {
    const { registry, atoms } = setup({
      get: () => Effect.succeed({ name: 'My notebook', content: { cells: [] } }),
    })
    const id = NotebookId.make('server-id')

    const result = await waitFor(registry, atoms.nameAtom(key(id)), (r) => r._tag === 'Success')

    expect(result._tag === 'Success' && result.value).toBe('My notebook')
    const content = registry.get(atoms.resolvedContentAtom(key(id)))
    expect(content._tag === 'Success' && content.value).toEqual({ cells: [] })
  })

  it('shares one request across overlapping reads instead of firing one each', async () => {
    let calls = 0
    const { registry, atoms } = setup({
      get: () => {
        calls += 1
        return Effect.succeed({ name: 'My notebook', content: { cells: [] } })
      },
    })
    const atom = atoms.nameAtom(key(NotebookId.make('server-id')))

    await Promise.all([
      waitFor(registry, atom, (r) => r._tag === 'Success'),
      waitFor(registry, atom, (r) => r._tag === 'Success'),
    ])

    expect(calls).toBe(1)
  })

  it('shares one request with resolvedContentAtom mounted for the same key', async () => {
    let calls = 0
    const { registry, atoms } = setup({
      get: () => {
        calls += 1
        return Effect.succeed({ name: 'My notebook', content: { cells: [] } })
      },
    })
    const id = NotebookId.make('server-id')

    await Promise.all([
      waitFor(registry, atoms.nameAtom(key(id)), (r) => r._tag === 'Success'),
      waitFor(registry, atoms.resolvedContentAtom(key(id)), (r) => r._tag === 'Success'),
    ])

    expect(calls).toBe(1)
  })

  it('refresh forces a real re-fetch instead of replaying the cached value', async () => {
    let calls = 0
    const { registry, atoms } = setup({
      get: () => {
        calls += 1
        return Effect.succeed({ name: `attempt ${calls}`, content: { cells: [] } })
      },
    })
    const atom = atoms.nameAtom(key(NotebookId.make('server-id')))

    const first = await waitFor(registry, atom, (r) => r._tag === 'Success')
    expect(first._tag === 'Success' && first.value).toBe('attempt 1')

    registry.refresh(atom)

    const second = await waitFor(
      registry,
      atom,
      (r) => r._tag === 'Success' && !r.waiting && r.value === 'attempt 2'
    )
    expect(calls).toBe(2)
    expect(second._tag === 'Success' && second.value).toBe('attempt 2')
  })
})

describe('statusAtom', () => {
  it('reactively flips to "saved" once an in-flight load resolves, for a subscriber that mounted first', async () => {
    let resolveGet!: (record: NotebookRecord) => void
    const pending = new Promise<NotebookRecord>((resolve) => {
      resolveGet = resolve
    })
    const { registry, atoms } = setup({ get: () => Effect.promise(() => pending) })
    const id = NotebookId.make('server-id')

    const seenStatuses: Array<string | undefined> = []
    const unsubscribe = registry.subscribe(atoms.statusAtom(key(id)), (status) =>
      seenStatuses.push(status)
    )
    // Not yet known to exist server-side, and no local content either — this
    // is "still loading," not "new" (a real notebook created locally).
    expect(registry.get(atoms.statusAtom(key(id)))).toBeUndefined()

    // Simulates a component doing `useAtomValue(notebooksAtoms.nameAtom(key))` —
    // `registry.mount` kicks off the fetch without waiting on it, the same way.
    registry.mount(atoms.nameAtom(key(id)))
    resolveGet({ name: 'My notebook', content: { cells: [] } })

    await waitFor(registry, atoms.statusAtom(key(id)), (status) => status === 'saved')

    expect(seenStatuses).toContain('saved')
    unsubscribe()
  })

  it('reflects a notebook settled via a direct nameAtom read', async () => {
    const { registry, atoms } = setup({
      get: () => Effect.succeed({ name: 'My notebook', content: { cells: [] } }),
    })
    const id = NotebookId.make('server-id')

    await waitFor(registry, atoms.nameAtom(key(id)), (r) => r._tag === 'Success')

    expect(registry.get(atoms.statusAtom(key(id)))).toBe('saved')
  })

  it('is undefined — not "new" — for a notebook that is still loading', () => {
    const { registry, atoms } = setup({
      get: () => Effect.promise(() => new Promise<NotebookRecord>(() => {})),
    })
    const id = NotebookId.make('server-id')
    registry.mount(atoms.nameAtom(key(id)))

    expect(registry.get(atoms.statusAtom(key(id)))).toBeUndefined()
  })

  it('is undefined for a notebook whose load failed, not "new"', async () => {
    const { registry, atoms } = setup({
      get: () => Effect.fail(new GetNotebookError({ cause: 'boom' })),
    })
    const id = NotebookId.make('server-id')

    await waitFor(registry, atoms.nameAtom(key(id)), (r) => r._tag === 'Failure')

    expect(registry.get(atoms.statusAtom(key(id)))).toBeUndefined()
  })
})

describe('resolvedContentAtom', () => {
  it('starts in the Initial state while a load is in flight', () => {
    const { registry, atoms } = setup({
      get: () => Effect.promise(() => new Promise<NotebookRecord>(() => {})),
    })
    const id = NotebookId.make('server-id')
    registry.mount(atoms.nameAtom(key(id)))

    expect(registry.get(atoms.resolvedContentAtom(key(id)))._tag).toBe('Initial')
  })

  it('surfaces a load failure instead of silently resolving to undefined', async () => {
    const { registry, atoms } = setup({
      get: () => Effect.fail(new GetNotebookError({ cause: 'boom' })),
    })
    const id = NotebookId.make('server-id')

    await waitFor(registry, atoms.nameAtom(key(id)), (r) => r._tag === 'Failure')

    expect(registry.get(atoms.resolvedContentAtom(key(id)))._tag).toBe('Failure')
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
