import { Duration, Effect, Layer, Stream } from 'effect'
import { describe, expect, it } from 'vitest'

import type { NotebookId } from './notebook.schema'
import { NotebooksApi, type ListNotebooksPage, type ListNotebooksParams } from './notebooks.api'
import { notebookPageStream, PAGE_SIZE } from './notebooks.list'

const summary = (id: string) => ({ id: id as NotebookId, name: id, favorite: false })

const layerFromPages = (pages: ReadonlyArray<ListNotebooksPage>) => {
  const calls: Array<ListNotebooksParams> = []
  let cursor = 0
  const layer = Layer.succeed(NotebooksApi, {
    list: (params) =>
      Effect.sync(() => {
        calls.push(params)
        const page = pages[cursor]
        cursor += 1
        return page ?? { items: [], nextCursor: undefined }
      }),
    get: () => Effect.die('not used'),
    save: () => Effect.die('not used'),
  })
  return { layer, calls }
}

const collect = (
  layer: Layer.Layer<NotebooksApi>,
  params: { projectRef: string; search: string; favoritesOnly: boolean }
) =>
  Effect.runPromise(
    Stream.runCollect(notebookPageStream(params, { debounce: Duration.zero })).pipe(
      Effect.provide(layer),
      Effect.map((chunk) => Array.from(chunk))
    )
  )

describe('notebookPageStream', () => {
  it('walks pages via the returned cursor until nextCursor is undefined', async () => {
    const { layer, calls } = layerFromPages([
      { items: [summary('a'), summary('b')], nextCursor: 'page-2' },
      { items: [summary('c')], nextCursor: undefined },
    ])

    const items = await collect(layer, { projectRef: 'ref', search: '', favoritesOnly: false })

    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(calls.map((c) => c.cursor)).toEqual([undefined, 'page-2'])
  })

  it('terminates immediately when the first page has no next cursor', async () => {
    const { layer, calls } = layerFromPages([{ items: [summary('a')], nextCursor: undefined }])

    const items = await collect(layer, { projectRef: 'ref', search: '', favoritesOnly: false })

    expect(items.map((i) => i.id)).toEqual(['a'])
    expect(calls).toHaveLength(1)
  })

  it('passes params and the fixed page size through to each request', async () => {
    const { layer, calls } = layerFromPages([{ items: [], nextCursor: undefined }])

    await collect(layer, { projectRef: 'my-ref', search: 'foo', favoritesOnly: true })

    expect(calls[0]).toEqual({
      projectRef: 'my-ref',
      search: 'foo',
      favoritesOnly: true,
      cursor: undefined,
      limit: PAGE_SIZE,
    })
  })

  it('skips the debounce sleep entirely when search is empty, regardless of the debounce option', async () => {
    const { layer, calls } = layerFromPages([{ items: [summary('a')], nextCursor: undefined }])

    const items = await Effect.runPromise(
      Stream.runCollect(
        notebookPageStream(
          { projectRef: 'ref', search: '', favoritesOnly: false },
          { debounce: Duration.seconds(30) }
        )
      ).pipe(
        Effect.provide(layer),
        Effect.map((chunk) => Array.from(chunk))
      )
    )

    expect(items.map((i) => i.id)).toEqual(['a'])
    expect(calls).toHaveLength(1)
  })
})
