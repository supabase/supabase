import { beforeEach, describe, expect, it } from 'vitest'

import { createRequestTimingCollector } from './request-timing-collector'

let time = 0

const createCollector = (isSampled = true) =>
  createRequestTimingCollector({ isSampled, sampleRate: 0.1, now: () => time })

const fetchOk = (startMs: number, endMs: number, endpoint = 'GET /platform/a') => ({
  endpoint,
  startMs,
  endMs,
  isError: false,
})

beforeEach(() => {
  time = 0
})

describe('route visits', () => {
  it('summarizes the first visit as the initial load, then starts non-initial visits', () => {
    const collector = createCollector()
    collector.setRouteTemplate('/project/[ref]')
    collector.recordRequest(fetchOk(50, 150))
    time = 400

    const first = collector.finishVisit()

    expect(first).toMatchObject({
      routeTemplate: '/project/[ref]',
      isInitialLoad: true,
      resumedAfterHidden: false,
      visitDurationMs: 400,
      sampleRate: 0.1,
      requestCount: 1,
      requestBusyMs: 100,
    })

    collector.setRouteTemplate('/project/[ref]/editor')
    time = 900
    expect(collector.finishVisit()).toMatchObject({
      routeTemplate: '/project/[ref]/editor',
      isInitialLoad: false,
      visitDurationMs: 500,
      requestCount: 0,
    })
  })

  it('keeps each visit separate', () => {
    const collector = createCollector()
    collector.setRouteTemplate('/a')
    collector.recordRequest(fetchOk(0, 10))
    collector.recordQuery({
      label: 'profile',
      durationMs: 20,
      isError: false,
      isBackgroundRefetch: false,
    })
    collector.finishVisit()

    collector.setRouteTemplate('/b')
    const second = collector.finishVisit()

    expect(second).toMatchObject({ requestCount: 0, queryFetchCount: 0, mutationCount: 0 })
  })

  it('reports an unknown route when no template was set', () => {
    expect(createCollector().finishVisit()?.routeTemplate).toBe('unknown')
  })

  it('counts a request that began in the previous visit from the start of this one', () => {
    const collector = createCollector()
    time = 1000
    collector.finishVisit()

    // Sent at 900, during the previous visit, and finished 100ms into this one
    collector.recordRequest(fetchOk(900, 1100))
    time = 1500
    const summary = collector.finishVisit()

    expect(summary).toMatchObject({ requestSumMs: 100, requestBusyMs: 100, requestSpanMs: 100 })
  })

  it('does not report an empty visit that only began because the tab became visible', () => {
    const collector = createCollector()
    collector.finishVisit({ resumedAfterHidden: true })

    expect(collector.finishVisit()).toBeUndefined()
  })

  it('keeps the route when the tab comes back, but not when the route changes', () => {
    const collector = createCollector()
    collector.setRouteTemplate('/project/[ref]')
    collector.finishVisit({ resumedAfterHidden: true })
    collector.recordRequest(fetchOk(10, 20))

    expect(collector.finishVisit()).toMatchObject({
      routeTemplate: '/project/[ref]',
      resumedAfterHidden: true,
    })

    collector.recordRequest(fetchOk(30, 40))
    expect(collector.finishVisit()?.routeTemplate).toBe('unknown')
  })

  it('reports a resumed visit that did work, marked as resumed', () => {
    const collector = createCollector()
    collector.finishVisit({ resumedAfterHidden: true })
    collector.recordRequest(fetchOk(10, 20))

    expect(collector.finishVisit()).toMatchObject({ resumedAfterHidden: true, requestCount: 1 })
  })

  it('stops keeping records in a visit once it has too many', () => {
    const collector = createCollector()
    for (let index = 0; index < 1005; index++) collector.recordRequest(fetchOk(0, 1))

    expect(collector.finishVisit()?.requestCount).toBe(1000)
  })
})

describe('sampling', () => {
  it('records and reports nothing for a page load that was not sampled', () => {
    const collector = createCollector(false)
    collector.recordRequest(fetchOk(0, 10))
    collector.recordQuery({
      label: 'profile',
      durationMs: 1,
      isError: false,
      isBackgroundRefetch: false,
    })
    collector.recordMutation({ durationMs: 1, isError: false })

    expect(collector.isRecording).toBe(false)
    expect(collector.finishVisit()).toBeUndefined()
  })
})

describe('consent', () => {
  it('discards what was held and records nothing while consent is denied', () => {
    const collector = createCollector()
    collector.recordRequest(fetchOk(0, 10))
    collector.queueSummary(collector.finishVisit()!)
    collector.recordRequest(fetchOk(20, 30))

    collector.discardAndPause()
    collector.recordRequest(fetchOk(40, 50))

    expect(collector.drainQueuedSummaries()).toEqual([])
    expect(collector.isRecording).toBe(false)
    expect(collector.finishVisit()).toBeUndefined()
  })

  it('records again once consent is granted after a denial', () => {
    const collector = createCollector()
    collector.discardAndPause()
    collector.resume()
    collector.recordRequest(fetchOk(0, 10))

    expect(collector.finishVisit()).toMatchObject({ requestCount: 1 })
  })

  it('holds finished summaries until drained, keeping only the newest few', () => {
    const collector = createCollector()
    for (let index = 1; index <= 7; index++) {
      collector.setRouteTemplate(`/route-${index}`)
      collector.queueSummary(collector.finishVisit()!)
    }

    const drained = collector.drainQueuedSummaries()

    expect(drained.map((summary) => summary.routeTemplate)).toEqual([
      '/route-3',
      '/route-4',
      '/route-5',
      '/route-6',
      '/route-7',
    ])
    expect(collector.drainQueuedSummaries()).toEqual([])
  })
})
