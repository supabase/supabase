import type { Readable } from 'node:stream'
import { getHeapSnapshot } from 'node:v8'

export class ProfilingBusyError extends Error {}

export class HeapSnapshotController {
  private active = false

  isActive() {
    return this.active
  }

  heapSnapshot(signal?: AbortSignal): Readable {
    if (this.active)
      throw new ProfilingBusyError('A profile capture is already active in this isolate')
    this.active = true
    try {
      const stream = getHeapSnapshot()
      const abort = () => stream.destroy()
      const release = () => {
        signal?.removeEventListener('abort', abort)
        this.active = false
      }
      stream.once('end', release).once('close', release).once('error', release)
      if (signal?.aborted) abort()
      else signal?.addEventListener('abort', abort, { once: true })
      return stream
    } catch (error) {
      this.active = false
      throw error
    }
  }
}

export const heapSnapshotController = new HeapSnapshotController()
