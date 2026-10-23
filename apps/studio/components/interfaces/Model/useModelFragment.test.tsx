import { Blob } from 'node:buffer'
import { DecompressionStream, ReadableStream as NodeReadableStream } from 'node:stream/web'
import { gzipSync } from 'node:zlib'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createExampleModel } from './model.schema'
import { useModelFragment } from './useModelFragment'

beforeAll(() => {
  vi.stubGlobal('Blob', Blob)
  vi.stubGlobal('DecompressionStream', DecompressionStream)
})
afterAll(() => vi.unstubAllGlobals())
afterEach(() => {
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

function changeHash(hash: string) {
  window.history.replaceState(null, '', `/${hash}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

const fragment = (value: unknown) => `#v1=${gzipSync(JSON.stringify(value)).toString('base64url')}`

describe('fragment navigation', () => {
  it('updates on hash changes and recovers after an invalid link', async () => {
    const model = createExampleModel()
    const { result } = renderHook(useModelFragment)
    await waitFor(() => expect(result.current.status).toBe('empty'))
    act(() => changeHash(fragment(model)))
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', model }))
    act(() => changeHash('#v2=unsupported'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    act(() => changeHash(''))
    await waitFor(() => expect(result.current.status).toBe('empty'))
    act(() => changeHash(fragment({ ...model, title: 'Recovered' })))
    await waitFor(() =>
      expect(result.current).toEqual({ status: 'ready', model: { ...model, title: 'Recovered' } })
    )
  })

  it('cancels a slow earlier decode so only the latest fragment can render', async () => {
    const cancel = vi.fn()
    vi.spyOn(Blob.prototype, 'stream').mockImplementationOnce(
      () => new NodeReadableStream({ cancel })
    )
    const model = createExampleModel()
    window.history.replaceState(null, '', `/${fragment({ ...model, title: 'Stale title' })}`)
    const { result, unmount } = renderHook(useModelFragment)
    expect(result.current.status).toBe('loading')
    act(() => changeHash(fragment(model)))
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', model }))
    await waitFor(() => expect(cancel).toHaveBeenCalledOnce())
    unmount()
  })
})
