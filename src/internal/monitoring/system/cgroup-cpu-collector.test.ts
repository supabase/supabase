import * as fs from 'node:fs'
import { Meter } from '@opentelemetry/api'
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest'
import { CgroupCpuCollector, parseCpuStat } from './cgroup-cpu-collector'

vi.mock('@internal/monitoring/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logSchema: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    event: vi.fn(),
    request: vi.fn(),
  },
}))

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  }
})

const existsSync = fs.existsSync as unknown as Mock
const readFileSync = fs.readFileSync as unknown as Mock

const V2_BLOB = `usage_usec 1234567
user_usec 1000000
system_usec 234567
nr_periods 1000
nr_throttled 25
throttled_usec 5000
`

const V1_BLOB = `nr_periods 500
nr_throttled 12
throttled_time 7500000
`

interface CapturedInstrument {
  name: string
  callback: (observable: {
    observe: (value: number, labels?: Record<string, string>) => void
  }) => void
}

interface CapturedObservation {
  name: string
  value: number
  labels?: Record<string, string>
}

function createMockMeter(): {
  meter: Meter
  instruments: CapturedInstrument[]
  invoke: (name: string) => CapturedObservation[]
} {
  const instruments: CapturedInstrument[] = []

  const make = () => (name: string) => ({
    addCallback(callback: CapturedInstrument['callback']) {
      instruments.push({ name, callback })
      return this
    },
  })

  const meter = {
    createObservableCounter: make(),
    createObservableGauge: make(),
  } as unknown as Meter

  const invoke = (name: string): CapturedObservation[] => {
    const observations: CapturedObservation[] = []
    const observable = {
      observe: (value: number, labels?: Record<string, string>) =>
        observations.push({ name, value, labels }),
    }
    for (const inst of instruments) {
      if (inst.name === name) inst.callback(observable)
    }
    return observations
  }

  return { meter, instruments, invoke }
}

describe('parseCpuStat', () => {
  test('parses cgroup v2 blob and converts throttled_usec to ns', () => {
    expect(parseCpuStat(V2_BLOB, 'v2')).toEqual({
      nr_periods: 1000,
      nr_throttled: 25,
      throttled_time_ns: 5_000_000,
    })
  })

  test('parses cgroup v1 blob and keeps throttled_time as ns', () => {
    expect(parseCpuStat(V1_BLOB, 'v1')).toEqual({
      nr_periods: 500,
      nr_throttled: 12,
      throttled_time_ns: 7_500_000,
    })
  })

  test('returns null when required fields are missing', () => {
    expect(parseCpuStat('nr_periods 10\nnr_throttled 1\n', 'v2')).toBeNull()
  })
})

describe('CgroupCpuCollector', () => {
  const originalPlatform = process.platform

  beforeEach(() => {
    existsSync.mockReset()
    readFileSync.mockReset()
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  test('short-circuits on non-Linux platforms and registers no instruments', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })

    const { meter, instruments } = createMockMeter()
    const collector = new CgroupCpuCollector({})
    collector.enable()
    collector.updateMetricInstruments(meter)

    expect(instruments).toHaveLength(0)
    expect(readFileSync).not.toHaveBeenCalled()
    expect(existsSync).not.toHaveBeenCalled()
  })

  test('emits 0 for throttled_ratio on the first sample (divide-by-zero guard)', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue(V2_BLOB)

    const { meter, invoke } = createMockMeter()
    const collector = new CgroupCpuCollector({})
    collector.enable()
    collector.updateMetricInstruments(meter)

    expect(invoke('process.cpu.cfs.throttled_ratio')).toEqual([
      { name: 'process.cpu.cfs.throttled_ratio', value: 0, labels: {} },
    ])
  })

  test('computes throttled_ratio between observations and avoids NaN when no new periods', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue(V2_BLOB)

    const { meter, invoke } = createMockMeter()
    const collector = new CgroupCpuCollector({})
    collector.enable()
    collector.updateMetricInstruments(meter)

    // First sample → 0
    invoke('process.cpu.cfs.throttled_ratio')

    // Second sample: +100 periods, +5 throttled → 0.05
    readFileSync.mockReturnValue(`nr_periods 1100
nr_throttled 30
throttled_usec 5000
`)
    const second = invoke('process.cpu.cfs.throttled_ratio')
    expect(second).toEqual([{ name: 'process.cpu.cfs.throttled_ratio', value: 0.05, labels: {} }])

    // Third sample identical → no new periods → 0, not NaN
    const third = invoke('process.cpu.cfs.throttled_ratio')
    expect(third).toEqual([{ name: 'process.cpu.cfs.throttled_ratio', value: 0, labels: {} }])
  })

  test('observes counter values parsed from cpu.stat', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue(V2_BLOB)

    const { meter, invoke } = createMockMeter()
    const collector = new CgroupCpuCollector({})
    collector.enable()
    collector.updateMetricInstruments(meter)

    expect(invoke('process.cpu.cfs.periods')).toEqual([
      { name: 'process.cpu.cfs.periods', value: 1000, labels: {} },
    ])
    expect(invoke('process.cpu.cfs.throttled_periods')).toEqual([
      { name: 'process.cpu.cfs.throttled_periods', value: 25, labels: {} },
    ])
    expect(invoke('process.cpu.cfs.throttled_time')).toEqual([
      { name: 'process.cpu.cfs.throttled_time', value: 5_000_000, labels: {} },
    ])
  })

  test('applies configured prefix and labels to instrument names and observations', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue(V2_BLOB)

    const { meter, invoke } = createMockMeter()
    const collector = new CgroupCpuCollector({
      prefix: 'storage',
      labels: { region: 'eu-west-1' },
    })
    collector.enable()
    collector.updateMetricInstruments(meter)

    expect(invoke('storage.process.cpu.cfs.periods')).toEqual([
      {
        name: 'storage.process.cpu.cfs.periods',
        value: 1000,
        labels: { region: 'eu-west-1' },
      },
    ])
  })

  test('does not observe when disabled', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    existsSync.mockReturnValue(true)
    readFileSync.mockReturnValue(V2_BLOB)

    const { meter, invoke } = createMockMeter()
    const collector = new CgroupCpuCollector({})
    collector.enable()
    collector.updateMetricInstruments(meter)
    collector.disable()

    expect(invoke('process.cpu.cfs.periods')).toEqual([])
  })
})
