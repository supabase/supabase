import { Meter } from '@opentelemetry/api'

export interface MetricCollector {
  enable(): void
  disable(): void
  updateMetricInstruments(meter: Meter): void
}

export interface CollectorConfig {
  prefix?: string
  labels?: Record<string, string>
}

export abstract class BaseCollector<T extends CollectorConfig = CollectorConfig>
  implements MetricCollector
{
  protected _config: T
  protected _enabled = false

  constructor(config: T) {
    this._config = config
  }

  get namePrefix(): string {
    return this._config.prefix ? `${this._config.prefix}.` : ''
  }

  get labels(): Record<string, string> {
    return this._config.labels ?? {}
  }

  enable(): void {
    if (this._enabled) {
      return
    }

    this._enabled = true
    this.internalEnable()
  }

  disable(): void {
    if (!this._enabled) {
      return
    }

    this._enabled = false
    this.internalDisable()
  }

  abstract updateMetricInstruments(meter: Meter): void
  protected abstract internalEnable(): void
  protected abstract internalDisable(): void
}
