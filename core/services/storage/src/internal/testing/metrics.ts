import type { Meter } from '@opentelemetry/api'
import { vi } from 'vitest'

type BatchObserver = (observer: { observe: (...args: unknown[]) => void }) => void

export function captureBatchObserver(metricsModule: { meter: Meter }, observable?: unknown) {
  let batchObserver: BatchObserver | undefined
  const spy = vi
    .spyOn(metricsModule.meter, 'addBatchObservableCallback')
    .mockImplementation((callback, observables) => {
      if (observable === undefined || observables.includes(observable as never)) {
        batchObserver = callback as BatchObserver
      }
    })
  return {
    spy,
    observe(observeSpy: (...args: unknown[]) => void): void {
      batchObserver?.({ observe: observeSpy })
    },
  }
}
