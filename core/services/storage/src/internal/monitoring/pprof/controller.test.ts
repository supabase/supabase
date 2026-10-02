import { PassThrough } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  heapSnapshot: vi.fn(),
}))

vi.mock('node:v8', () => ({ getHeapSnapshot: mocks.heapSnapshot }))

import { HeapSnapshotController, ProfilingBusyError } from './controller'

describe('heap snapshot controller', () => {
  let controller: HeapSnapshotController

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.heapSnapshot.mockImplementation(() => new PassThrough())
    controller = new HeapSnapshotController()
  })

  it('rejects an overlapping heap snapshot', () => {
    controller.heapSnapshot()

    expect(() => controller.heapSnapshot()).toThrow(ProfilingBusyError)
  })

  it('releases the controller when the snapshot stream closes', async () => {
    const stream = controller.heapSnapshot()

    stream.destroy()

    await vi.waitFor(() => expect(controller.isActive()).toBe(false))
  })

  it('destroys an in-flight heap snapshot when its signal aborts', async () => {
    const abort = new AbortController()
    const stream = controller.heapSnapshot(abort.signal)

    abort.abort()

    await vi.waitFor(() => expect(controller.isActive()).toBe(false))
    expect(stream.destroyed).toBe(true)
  })
})
