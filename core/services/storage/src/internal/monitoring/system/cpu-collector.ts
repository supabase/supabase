import { Counter, Meter } from '@opentelemetry/api'
import { BaseCollector } from './base-collector'

export class CpuCollector extends BaseCollector {
  private _lastCpuUsage = process.cpuUsage()
  private _userCounter: Counter | null = null
  private _systemCounter: Counter | null = null

  updateMetricInstruments(meter: Meter): void {
    this._userCounter = meter.createCounter(`${this.namePrefix}process.cpu.user`, {
      description: 'Total user CPU time spent in seconds',
      unit: 's',
    })

    this._systemCounter = meter.createCounter(`${this.namePrefix}process.cpu.system`, {
      description: 'Total system CPU time spent in seconds',
      unit: 's',
    })

    meter
      .createObservableCounter(`${this.namePrefix}process.cpu.total`, {
        description: 'Total user and system CPU time spent in seconds',
        unit: 's',
      })
      .addCallback((observable) => {
        if (!this._enabled) return

        const cpuUsage = process.cpuUsage()
        const userDelta = (cpuUsage.user - this._lastCpuUsage.user) / 1e6
        const systemDelta = (cpuUsage.system - this._lastCpuUsage.system) / 1e6

        if (userDelta > 0) this._userCounter?.add(userDelta, this.labels)
        if (systemDelta > 0) this._systemCounter?.add(systemDelta, this.labels)

        this._lastCpuUsage = cpuUsage

        const totalSeconds = (cpuUsage.user + cpuUsage.system) / 1e6
        observable.observe(totalSeconds, this.labels)
      })
  }

  protected internalEnable(): void {
    this._lastCpuUsage = process.cpuUsage()
  }

  protected internalDisable(): void {
    // no-op
  }
}
