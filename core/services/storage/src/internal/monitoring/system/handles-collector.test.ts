import { Meter, Observable } from '@opentelemetry/api'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { HandlesCollector } from './handles-collector'

type ProcessWithActiveResources = NodeJS.Process & {
  _getActiveHandles?: () => unknown[] | null | undefined
  _getActiveRequests?: () => unknown[] | null | undefined
}

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

  return { meter, invokeBatch }
}

describe('HandlesCollector', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('observes active handle and request gauges from one batch callback', () => {
    const processWithActiveResources = process as ProcessWithActiveResources
    const getActiveHandles = vi
      .spyOn(processWithActiveResources, '_getActiveHandles')
      .mockReturnValue([{}, {}])
    const getActiveRequests = vi
      .spyOn(processWithActiveResources, '_getActiveRequests')
      .mockReturnValue([{}])

    const { meter, invokeBatch } = createMockMeter()
    const collector = new HandlesCollector({
      prefix: 'test',
      labels: { tenant: 'tenant-a' },
    })

    collector.updateMetricInstruments(meter)
    collector.enable()

    expect(invokeBatch()).toEqual([
      {
        name: 'test.nodejs.active_handles.total',
        value: 2,
        labels: { tenant: 'tenant-a' },
      },
      {
        name: 'test.nodejs.active_requests.total',
        value: 1,
        labels: { tenant: 'tenant-a' },
      },
    ])
    expect(getActiveHandles).toHaveBeenCalledTimes(1)
    expect(getActiveRequests).toHaveBeenCalledTimes(1)
  })

  test('observes zero when active resource APIs return nullish values', () => {
    const processWithActiveResources = process as ProcessWithActiveResources
    vi.spyOn(processWithActiveResources, '_getActiveHandles').mockReturnValue(undefined)
    vi.spyOn(processWithActiveResources, '_getActiveRequests').mockReturnValue(null)

    const { meter, invokeBatch } = createMockMeter()
    const collector = new HandlesCollector({
      prefix: 'test',
      labels: { tenant: 'tenant-a' },
    })

    collector.updateMetricInstruments(meter)
    collector.enable()

    expect(invokeBatch()).toEqual([
      {
        name: 'test.nodejs.active_handles.total',
        value: 0,
        labels: { tenant: 'tenant-a' },
      },
      {
        name: 'test.nodejs.active_requests.total',
        value: 0,
        labels: { tenant: 'tenant-a' },
      },
    ])
  })
})
