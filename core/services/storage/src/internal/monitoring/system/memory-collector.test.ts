import { Meter, Observable } from '@opentelemetry/api'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { ExternalMemoryCollector } from './memory-collector'

interface CapturedInstrument {
  name: string
  observable: Observable<Record<string, string>>
}

interface CapturedObservation {
  name: string
  value: number
  labels?: Record<string, string>
}

function createMockMeter(): {
  meter: Meter
  instruments: CapturedInstrument[]
  invokeBatch: () => CapturedObservation[]
} {
  const instruments: CapturedInstrument[] = []
  const batchCallbacks: Array<
    (observable: {
      observe: (
        metric: Observable<Record<string, string>>,
        value: number,
        labels?: Record<string, string>
      ) => void
    }) => void
  > = []

  const meter = {
    createObservableGauge(name: string) {
      const observable = {
        addCallback: vi.fn(),
        removeCallback: vi.fn(),
      }
      instruments.push({ name, observable })
      return observable
    },
    addBatchObservableCallback(callback: (observable: never) => void) {
      batchCallbacks.push(callback as (typeof batchCallbacks)[number])
    },
  } as unknown as Meter

  const invokeBatch = (): CapturedObservation[] => {
    expect(batchCallbacks).toHaveLength(1)

    const observations: CapturedObservation[] = []
    const observable = {
      observe(
        metric: Observable<Record<string, string>>,
        value: number,
        labels?: Record<string, string>
      ) {
        const instrument = instruments.find((candidate) => candidate.observable === metric)
        expect(instrument).toBeDefined()
        observations.push({ name: instrument!.name, value, labels })
      },
    }

    batchCallbacks[0](observable)
    return observations
  }

  return { meter, instruments, invokeBatch }
}

describe('ExternalMemoryCollector', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('observes all memory gauges from one process.memoryUsage read', () => {
    const memoryUsage = vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 10,
      heapTotal: 20,
      heapUsed: 30,
      external: 40,
      arrayBuffers: 50,
    })

    const { meter, invokeBatch } = createMockMeter()
    const collector = new ExternalMemoryCollector({
      prefix: 'test',
      labels: { tenant: 'tenant-a' },
    })

    collector.updateMetricInstruments(meter)
    collector.enable()

    expect(invokeBatch()).toEqual([
      {
        name: 'test.nodejs.memory.external',
        value: 40,
        labels: { tenant: 'tenant-a' },
      },
      {
        name: 'test.nodejs.memory.array_buffers',
        value: 50,
        labels: { tenant: 'tenant-a' },
      },
      {
        name: 'test.nodejs.memory.rss',
        value: 10,
        labels: { tenant: 'tenant-a' },
      },
    ])
    expect(memoryUsage).toHaveBeenCalledTimes(1)
  })
})
