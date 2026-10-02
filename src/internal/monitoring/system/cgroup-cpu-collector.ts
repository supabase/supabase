// Project-local metric names — these are NOT part of the OpenTelemetry semantic
// conventions. The names `process.cpu.cfs.*` describe Linux cgroup CFS (Completely
// Fair Scheduler) bandwidth-control state and are kept stable for our backends.

import * as fs from 'node:fs'
import { logger, logSchema } from '@internal/monitoring/logger'
import { Meter } from '@opentelemetry/api'
import { BaseCollector } from './base-collector'

const V2_CONTROLLERS = '/sys/fs/cgroup/cgroup.controllers'
const V2_STAT = '/sys/fs/cgroup/cpu.stat'
const V1_PRIMARY = '/sys/fs/cgroup/cpu,cpuacct/cpu.stat'
const V1_FALLBACK = '/sys/fs/cgroup/cpu/cpu.stat'

export type CgroupVersion = 'v1' | 'v2'

export interface CgroupCpuStatSample {
  nr_periods: number
  nr_throttled: number
  throttled_time_ns: number
}

export interface CgroupSource {
  version: CgroupVersion
  path: string
}

export function parseCpuStat(content: string, version: CgroupVersion): CgroupCpuStatSample | null {
  let nrPeriods: number | null = null
  let nrThrottled: number | null = null
  let throttledNs: number | null = null

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const space = line.indexOf(' ')
    if (space === -1) continue
    const key = line.slice(0, space)
    const value = Number(line.slice(space + 1).trim())
    if (!Number.isFinite(value)) continue

    if (key === 'nr_periods') {
      nrPeriods = value
    } else if (key === 'nr_throttled') {
      nrThrottled = value
    } else if (version === 'v2' && key === 'throttled_usec') {
      throttledNs = value * 1000
    } else if (version === 'v1' && key === 'throttled_time') {
      throttledNs = value
    }
  }

  if (nrPeriods === null || nrThrottled === null || throttledNs === null) {
    return null
  }
  return {
    nr_periods: nrPeriods,
    nr_throttled: nrThrottled,
    throttled_time_ns: throttledNs,
  }
}

export function detectCgroupSource(): CgroupSource | null {
  if (process.platform !== 'linux') return null

  try {
    if (fs.existsSync(V2_CONTROLLERS)) {
      fs.readFileSync(V2_STAT, 'utf8')
      return { version: 'v2', path: V2_STAT }
    }
  } catch {
    // Fall through to v1 candidates
  }

  for (const path of [V1_PRIMARY, V1_FALLBACK]) {
    try {
      fs.readFileSync(path, 'utf8')
      return { version: 'v1', path }
    } catch {
      // Try next
    }
  }

  return null
}

export class CgroupCpuCollector extends BaseCollector {
  private _source: CgroupSource | null = null
  private _previous: { nr_periods: number; nr_throttled: number } | null = null
  private _readErrorLogged = false

  updateMetricInstruments(meter: Meter): void {
    this._source = detectCgroupSource()
    if (!this._source) {
      logger.debug(
        { type: 'cgroup-cpu-metrics', platform: process.platform },
        '[cgroup CPU metrics] cgroup cpu.stat not available, skipping'
      )
      return
    }

    meter
      .createObservableCounter(`${this.namePrefix}process.cpu.cfs.periods`, {
        description: 'Total CFS periods elapsed for the cgroup',
        unit: '{period}',
      })
      .addCallback((observable) => {
        if (!this._enabled) return
        const sample = this.readSample()
        if (sample) observable.observe(sample.nr_periods, this.labels)
      })

    meter
      .createObservableCounter(`${this.namePrefix}process.cpu.cfs.throttled_periods`, {
        description: 'CFS periods where the cgroup was throttled',
        unit: '{period}',
      })
      .addCallback((observable) => {
        if (!this._enabled) return
        const sample = this.readSample()
        if (sample) observable.observe(sample.nr_throttled, this.labels)
      })

    meter
      .createObservableCounter(`${this.namePrefix}process.cpu.cfs.throttled_time`, {
        description: 'Total time the cgroup was throttled, in nanoseconds',
        unit: 'ns',
      })
      .addCallback((observable) => {
        if (!this._enabled) return
        const sample = this.readSample()
        if (sample) observable.observe(sample.throttled_time_ns, this.labels)
      })

    meter
      .createObservableGauge(`${this.namePrefix}process.cpu.cfs.throttled_ratio`, {
        description: 'Fraction of recent CFS periods that were throttled',
        unit: '1',
      })
      .addCallback((observable) => {
        if (!this._enabled) return
        const sample = this.readSample()
        if (!sample) return
        if (!this._previous) {
          this._previous = { nr_periods: sample.nr_periods, nr_throttled: sample.nr_throttled }
          observable.observe(0, this.labels)
          return
        }
        const dPeriods = sample.nr_periods - this._previous.nr_periods
        const dThrottled = sample.nr_throttled - this._previous.nr_throttled
        this._previous = { nr_periods: sample.nr_periods, nr_throttled: sample.nr_throttled }
        const ratio = dPeriods > 0 ? dThrottled / dPeriods : 0
        observable.observe(Number.isFinite(ratio) ? ratio : 0, this.labels)
      })
  }

  protected internalEnable(): void {
    this._previous = null
    this._readErrorLogged = false
  }

  protected internalDisable(): void {
    // no-op
  }

  private readSample(): CgroupCpuStatSample | null {
    if (!this._source) return null
    try {
      const content = fs.readFileSync(this._source.path, 'utf8')
      return parseCpuStat(content, this._source.version)
    } catch (error) {
      if (!this._readErrorLogged) {
        this._readErrorLogged = true
        logSchema.warning(logger, '[cgroup CPU metrics] Failed to read cpu.stat', {
          type: 'cgroup-cpu-metrics',
          error,
        })
      }
      return null
    }
  }
}
