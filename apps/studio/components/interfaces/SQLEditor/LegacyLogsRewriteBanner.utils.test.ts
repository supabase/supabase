import { describe, expect, it } from 'vitest'

import {
  INITIAL_LEGACY_LOGS_REWRITE_STATE,
  legacyLogsRewriteReducer as reduce,
  type LegacyLogsRewriteEvent,
  type LegacyLogsRewriteState,
} from './LegacyLogsRewriteBanner.utils'

const run = (
  events: LegacyLogsRewriteEvent[],
  from: LegacyLogsRewriteState = INITIAL_LEGACY_LOGS_REWRITE_STATE
) => events.reduce(reduce, from)

const FAILED: LegacyLogsRewriteEvent = { type: 'rewriteFailed', message: 'boom' }

describe('legacyLogsRewriteReducer', () => {
  it('starts out offering the rewrite', () => {
    expect(INITIAL_LEGACY_LOGS_REWRITE_STATE).toEqual({ status: 'offered' })
  })

  it('requesting a rewrite moves to rewriting, and a proposal returns to offered', () => {
    expect(run([{ type: 'rewriteRequested' }])).toEqual({ status: 'rewriting' })
    expect(run([{ type: 'rewriteRequested' }, { type: 'rewriteProposed' }])).toEqual({
      status: 'offered',
    })
  })

  it('a failure lands in failed and keeps its message for the UI', () => {
    expect(run([{ type: 'rewriteRequested' }, FAILED])).toEqual({
      status: 'failed',
      message: 'boom',
    })
  })

  it('a failure is recoverable — the same request retries it', () => {
    expect(run([{ type: 'rewriteRequested' }, FAILED, { type: 'rewriteRequested' }])).toEqual({
      status: 'rewriting',
    })
  })

  it('an unchanged response waits for acknowledgement instead of retiring silently', () => {
    const noop = run([{ type: 'rewriteRequested' }, { type: 'rewriteNoop' }])
    expect(noop).toEqual({ status: 'noRewriteNeeded' })
    expect(run([{ type: 'dismissed' }], noop)).toEqual({ status: 'dismissed' })
  })

  it('both outcomes can be dismissed, and neither can be retried into a new outcome', () => {
    const failed = run([{ type: 'rewriteRequested' }, FAILED])
    expect(run([{ type: 'dismissed' }], failed)).toEqual({ status: 'dismissed' })
    // noRewriteNeeded only accepts dismissal — no silent retry.
    const noop = run([{ type: 'rewriteRequested' }, { type: 'rewriteNoop' }])
    expect(run([{ type: 'rewriteRequested' }], noop)).toEqual({ status: 'noRewriteNeeded' })
  })

  it('dismissal is terminal — nothing resurrects the offer', () => {
    const dismissed = run([{ type: 'dismissed' }])
    expect(dismissed).toEqual({ status: 'dismissed' })
    expect(
      run(
        [
          { type: 'rewriteRequested' },
          { type: 'rewriteProposed' },
          FAILED,
          { type: 'rewriteNoop' },
        ],
        dismissed
      )
    ).toEqual({ status: 'dismissed' })
  })

  it('cannot be dismissed mid-rewrite, so a settling request never resurrects it', () => {
    expect(run([{ type: 'rewriteRequested' }, { type: 'dismissed' }])).toEqual({
      status: 'rewriting',
    })
  })

  it('ignores events that are invalid for the current state', () => {
    // No rewrite in flight to settle.
    expect(run([{ type: 'rewriteProposed' }])).toEqual({ status: 'offered' })
    expect(run([{ type: 'rewriteNoop' }])).toEqual({ status: 'offered' })
    expect(run([FAILED])).toEqual({ status: 'offered' })
    // Already rewriting; a second request is a no-op rather than a restart.
    expect(run([{ type: 'rewriteRequested' }, { type: 'rewriteRequested' }])).toEqual({
      status: 'rewriting',
    })
  })
})
