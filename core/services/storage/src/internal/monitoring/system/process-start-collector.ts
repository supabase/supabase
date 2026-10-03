import { Meter } from '@opentelemetry/api'
import { BaseCollector } from './base-collector'

const START_TIME_SECONDS = Math.round(Date.now() / 1000 - process.uptime())

export class ProcessStartCollector extends BaseCollector {
  updateMetricInstruments(meter: Meter): void {
    meter
      .createObservableGauge(`${this.namePrefix}process.start_time`, {
        description: 'Start time of the process since unix epoch in seconds',
        unit: 's',
      })
      .addCallback((observable) => {
        if (!this._enabled) return
        observable.observe(START_TIME_SECONDS, this.labels)
      })
  }

  protected internalEnable(): void {
    // no-op
  }

  protected internalDisable(): void {
    // no-op
  }
}
