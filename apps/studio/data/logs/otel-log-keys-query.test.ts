import dayjs from 'dayjs'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { fetchOtelLogKeys } from './otel-log-keys-query'
import { addAPIMock } from '@/tests/lib/msw'

const OTEL_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all.otel'

interface RecordedRequest {
  lookbackHours: number
}

/**
 * Answers key-discovery requests with `keysPerCall[n]` for the nth call, and
 * records the width of each requested window so the escalation is observable.
 */
function mockKeyDiscovery(keysPerCall: string[][]) {
  const requests: RecordedRequest[] = []
  addAPIMock({
    method: 'post',
    path: OTEL_ENDPOINT,
    response: async ({ request }) => {
      const body = (await request.clone().json()) as {
        iso_timestamp_start: string
        iso_timestamp_end: string
      }
      requests.push({
        lookbackHours: dayjs(body.iso_timestamp_end).diff(dayjs(body.iso_timestamp_start), 'hour'),
      })
      const keys = keysPerCall[requests.length - 1] ?? []
      return HttpResponse.json({ result: keys.map((key) => ({ key })) })
    },
  })
  return requests
}

describe('fetchOtelLogKeys', () => {
  beforeEach(() => {
    addAPIMock({ method: 'get', path: OTEL_ENDPOINT, response: { result: [] } })
  })

  // `mapKeys` decompresses the whole log_attributes map for every row in the
  // window, so the narrow first step is the point of the change — a busy source
  // must never pay for the wide one.
  it('asks for one hour first and stops there when keys come back', async () => {
    const requests = mockKeyDiscovery([['request.method', 'request.path']])

    const keys = await fetchOtelLogKeys({ projectRef: 'default', source: 'edge_logs' })

    expect(keys).toEqual(['request.method', 'request.path'])
    expect(requests).toEqual([{ lookbackHours: 1 }])
  })

  // An empty window means the source was idle, not that it has no keys — so a
  // quiet project still resolves, just over more (and cheaper) scans.
  it('widens the window while a source returns nothing', async () => {
    const requests = mockKeyDiscovery([[], [], ['level', 'msg']])

    const keys = await fetchOtelLogKeys({ projectRef: 'default', source: 'auth_logs' })

    expect(keys).toEqual(['level', 'msg'])
    expect(requests.map((r) => r.lookbackHours)).toEqual([1, 24, 24 * 7])
  })

  it('gives up after the widest window rather than looping', async () => {
    const requests = mockKeyDiscovery([[], [], []])

    const keys = await fetchOtelLogKeys({ projectRef: 'default', source: 'edge_logs' })

    expect(keys).toEqual([])
    expect(requests).toHaveLength(3)
  })
})
