import type { RouteRequestsEvaluatedEvent } from 'common/telemetry-constants'

import {
  summarizeMutations,
  summarizeQueries,
  summarizeRequests,
  type MutationRecord,
  type QueryRecord,
  type RequestRecord,
} from './route-visit-summary.utils'

export type RouteRequestsSummary = RouteRequestsEvaluatedEvent['properties']

/**
 * Share of page loads that report. The decision is made once per page load, so a sampled
 * load reports every route visit in it and per-visit counts stay exact. Counts across loads
 * are rescaled with the `sampleRate` sent on each event.
 */
export const REQUEST_TIMING_SAMPLE_RATE = 0.1

// Bounds on what is held in memory. Past these, further records in a visit are not kept.
const MAX_RECORDS_PER_VISIT = 1000
const MAX_PENDING_SUMMARIES = 5

const UNKNOWN_ROUTE_TEMPLATE = 'unknown'

interface Visit {
  startMs: number
  routeTemplate: string | undefined
  isInitialLoad: boolean
  resumedAfterHidden: boolean
  requests: RequestRecord[]
  queries: QueryRecord[]
  mutations: MutationRecord[]
}

interface CollectorOptions {
  /** Whether this page load records at all: browser, platform, and chosen by sampling */
  isSampled: boolean
  sampleRate: number
  now?: () => number
}

/**
 * Tallies request, query and mutation timings into one summary per route visit.
 *
 * Records are held in memory only. The caller decides whether a finished summary may be sent
 * (it needs telemetry consent) and calls `discardAndPause` if consent is denied, so nothing
 * is stored or sent without it.
 *
 * Records land in the visit that is current when they finish. A request that started in the
 * previous visit is clamped to start at the current one.
 */
export function createRequestTimingCollector({
  isSampled,
  sampleRate,
  now = () => performance.now(),
}: CollectorOptions) {
  let isPaused = false
  let pendingSummaries: RouteRequestsSummary[] = []

  const newVisit = (overrides: Partial<Visit> = {}): Visit => ({
    startMs: now(),
    routeTemplate: undefined,
    isInitialLoad: false,
    resumedAfterHidden: false,
    requests: [],
    queries: [],
    mutations: [],
    // The first visit began when the page did, before this collector existed
    ...overrides,
  })

  let visit = newVisit({ startMs: 0, isInitialLoad: true })

  const isRecording = () => isSampled && !isPaused

  return {
    now,

    /** Whether this page load was chosen for reporting. Fixed for the life of the page. */
    get isSampled() {
      return isSampled
    },

    /** Timings are only recorded when this is true, so callers can skip their own work */
    get isRecording() {
      return isRecording()
    },

    setRouteTemplate(routeTemplate: string) {
      visit.routeTemplate = routeTemplate
    },

    recordRequest(record: RequestRecord) {
      if (!isRecording() || visit.requests.length >= MAX_RECORDS_PER_VISIT) return
      visit.requests.push({ ...record, startMs: Math.max(record.startMs, visit.startMs) })
    },

    recordQuery(record: QueryRecord) {
      if (!isRecording() || visit.queries.length >= MAX_RECORDS_PER_VISIT) return
      visit.queries.push(record)
    },

    recordMutation(record: MutationRecord) {
      if (!isRecording() || visit.mutations.length >= MAX_RECORDS_PER_VISIT) return
      visit.mutations.push(record)
    },

    /**
     * Ends the current visit and starts the next one. Returns the finished visit's summary, or
     * undefined if nothing was recorded for it or the page load isn't sampled. An empty visit
     * that only resulted from the tab becoming visible again is not worth reporting.
     */
    finishVisit(next: { resumedAfterHidden?: boolean } = {}): RouteRequestsSummary | undefined {
      const finished = visit
      const resumedAfterHidden = next.resumedAfterHidden ?? false
      // Coming back to a hidden tab continues the same route
      visit = newVisit({
        resumedAfterHidden,
        routeTemplate: resumedAfterHidden ? finished.routeTemplate : undefined,
      })

      if (!isRecording()) return undefined

      const hasActivity =
        finished.requests.length > 0 || finished.queries.length > 0 || finished.mutations.length > 0
      if (finished.resumedAfterHidden && !hasActivity) return undefined

      return {
        routeTemplate: finished.routeTemplate ?? UNKNOWN_ROUTE_TEMPLATE,
        isInitialLoad: finished.isInitialLoad,
        resumedAfterHidden: finished.resumedAfterHidden,
        visitDurationMs: Math.round(now() - finished.startMs),
        sampleRate,
        ...summarizeRequests(finished.requests),
        ...summarizeQueries(finished.queries),
        ...summarizeMutations(finished.mutations),
      }
    },

    /** Holds a finished summary until consent allows sending it. Keeps the newest few. */
    queueSummary(summary: RouteRequestsSummary) {
      pendingSummaries = [...pendingSummaries, summary].slice(-MAX_PENDING_SUMMARIES)
    },

    drainQueuedSummaries() {
      const summaries = pendingSummaries
      pendingSummaries = []
      return summaries
    },

    /** Consent denied: drop everything held and stop recording */
    discardAndPause() {
      isPaused = true
      pendingSummaries = []
      // The route is still the one the user is on, so a summary after consent returns keeps it
      visit = newVisit({ isInitialLoad: visit.isInitialLoad, routeTemplate: visit.routeTemplate })
    },

    /** Consent granted after a denial. The visit is already clean, nothing was kept while paused. */
    resume() {
      isPaused = false
    },
  }
}

export type RequestTimingCollector = ReturnType<typeof createRequestTimingCollector>

// Reads the environment directly, as `IS_PLATFORM` in `@/lib/constants` does, rather than
// importing it: `fetchers.ts` pulls this module in everywhere, including tests that mock
// `@/lib/constants` and `common` with only the exports they need.
const isPlatform = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'

export const requestTimingCollector = createRequestTimingCollector({
  isSampled:
    typeof window !== 'undefined' && isPlatform && Math.random() < REQUEST_TIMING_SAMPLE_RATE,
  sampleRate: REQUEST_TIMING_SAMPLE_RATE,
})
