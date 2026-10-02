import { Meter } from '@opentelemetry/api'
import { BaseCollector } from './base-collector'

export class HandlesCollector extends BaseCollector {
  updateMetricInstruments(meter: Meter): void {
    const activeHandlesGauge = meter.createObservableGauge(
      `${this.namePrefix}nodejs.active_handles.total`,
      {
        description: 'Number of active libuv handles',
      }
    )

    const activeRequestsGauge = meter.createObservableGauge(
      `${this.namePrefix}nodejs.active_requests.total`,
      {
        description: 'Number of active libuv requests',
      }
    )

    meter.addBatchObservableCallback(
      (observable) => {
        if (!this._enabled) return

        // @ts-expect-error - _getActiveHandles is not in types but exists
        const handles = process._getActiveHandles?.() ?? []
        // @ts-expect-error - _getActiveRequests is not in types but exists
        const requests = process._getActiveRequests?.() ?? []
        observable.observe(activeHandlesGauge, handles.length, this.labels)
        observable.observe(activeRequestsGauge, requests.length, this.labels)
      },
      [activeHandlesGauge, activeRequestsGauge]
    )
  }

  protected internalEnable(): void {
    // no-op
  }

  protected internalDisable(): void {
    // no-op
  }
}
