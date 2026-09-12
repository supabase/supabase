import { act, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  INITIAL_LEGACY_LOGS_REWRITE_STATE,
  legacyLogsRewriteReducer as reduce,
  useLegacyLogsRewrite,
  type LegacyLogsRewriteEvent,
  type LegacyLogsRewriteState,
} from './useLegacyLogsRewrite'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { API_URL } from '@/lib/constants'
import { mswServer } from '@/tests/lib/msw'
import { renderSqlEditorHook, setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

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

describe('useLegacyLogsRewrite — dismiss', () => {
  // No detectable source, so key discovery is skipped and the only outbound
  // request is the completion call we control below.
  const SQL_WITHOUT_SOURCE = 'select 1 from logs limit 5'

  /** Keeps a requested rewrite in flight for the duration of the test. */
  function stallTheRewrite() {
    mswServer.use(
      http.post(`${API_URL}/ai/code/complete`, async () => {
        await delay(10_000)
        return HttpResponse.json('select 1 from logs')
      })
    )
  }

  /**
   * Exposes the resolved project alongside the hook: `requestRewrite` no-ops
   * without a project ref, so tests must wait for that query before asking.
   */
  async function renderDismissHarness() {
    const onDismissed = vi.fn()
    const utils = renderSqlEditorHook(() => {
      const { data: project } = useSelectedProjectQuery()
      const rewrite = useLegacyLogsRewrite({
        readSql: () => SQL_WITHOUT_SOURCE,
        onProposal: vi.fn(),
        onDismissed,
      })
      return { ...rewrite, projectRef: project?.ref }
    })
    await waitFor(() => expect(utils.result.current.projectRef).toBe('default'))
    return { ...utils, onDismissed }
  }

  beforeEach(() => {
    setupSqlEditorMocks()
  })

  it('dismisses from the offer and reports it', async () => {
    const { result, onDismissed } = await renderDismissHarness()

    await act(async () => {
      result.current.dismiss()
    })

    expect(result.current.state.status).toBe('dismissed')
    expect(onDismissed).toHaveBeenCalledTimes(1)
  })

  it('does not report a dismissal the machine rejects mid-rewrite', async () => {
    stallTheRewrite()
    const { result, onDismissed } = await renderDismissHarness()

    act(() => {
      void result.current.requestRewrite()
    })
    await waitFor(() => expect(result.current.state.status).toBe('rewriting'))

    await act(async () => {
      result.current.dismiss()
    })

    // Persisting this would suppress an offer that's still live.
    expect(onDismissed).not.toHaveBeenCalled()
    expect(result.current.state.status).toBe('rewriting')
  })
})
