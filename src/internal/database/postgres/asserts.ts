import { createAbortError } from './pool-errors'

export function assertValidSignal(signal?: AbortSignal): void {
  if (!signal) {
    return
  }

  if (!(signal instanceof AbortSignal)) {
    throw new Error('Expected signal to be an instance of AbortSignal')
  }

  if (signal.aborted) {
    throw createAbortError()
  }
}
