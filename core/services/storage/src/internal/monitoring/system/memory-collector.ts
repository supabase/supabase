import { Meter } from '@opentelemetry/api'
import { BaseCollector } from './base-collector'

export class ExternalMemoryCollector extends BaseCollector {
  updateMetricInstruments(meter: Meter): void {
    const externalMemoryGauge = meter.createObservableGauge(
      `${this.namePrefix}nodejs.memory.external`,
      {
        description: 'Node.js external memory size in bytes',
        unit: 'By',
      }
    )

    const arrayBuffersMemoryGauge = meter.createObservableGauge(
      `${this.namePrefix}nodejs.memory.array_buffers`,
      {
        description: 'Node.js ArrayBuffers memory size in bytes',
        unit: 'By',
      }
    )

    const rssMemoryGauge = meter.createObservableGauge(`${this.namePrefix}nodejs.memory.rss`, {
      description: 'Resident Set Size - total memory allocated for the process',
      unit: 'By',
    })

    meter.addBatchObservableCallback(
      (observable) => {
        if (!this._enabled) return

        try {
          const mem = process.memoryUsage()
          if (mem.external !== undefined) {
            observable.observe(externalMemoryGauge, mem.external, this.labels)
          }
          if (mem.arrayBuffers !== undefined) {
            observable.observe(arrayBuffersMemoryGauge, mem.arrayBuffers, this.labels)
          }
          observable.observe(rssMemoryGauge, mem.rss, this.labels)
        } catch {
          // ignore errors
        }
      },
      [externalMemoryGauge, arrayBuffersMemoryGauge, rssMemoryGauge]
    )
  }

  protected internalEnable(): void {
    // no-op
  }

  protected internalDisable(): void {
    // no-op
  }
}
