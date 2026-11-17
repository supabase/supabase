import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useUnreadAlertIssuesCount } from './useUnreadAlertIssuesCount'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const base = {
  change: 'opened',
  title: 'Edge Function errors',
  severity: 'major',
  category: 'health',
  identifiers: { project: 'default' },
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-17T10:00:00Z',
  last_seen_at: '2026-11-17T10:00:00Z',
  attention_at: '2026-11-17T10:00:00Z',
  actor: 'system',
}

describe('useUnreadAlertIssuesCount', () => {
  it('counts unread alert issues that are not resolved', async () => {
    mswServer.use(
      http.get(`${API_URL}/platform/projects/:ref/alerts/issues`, () =>
        HttpResponse.json([
          { ...base, alert_issue_id: 'a', status: 'open', unread: true },
          { ...base, alert_issue_id: 'b', status: 'acknowledged', unread: true },
          { ...base, alert_issue_id: 'c', status: 'resolved', unread: true },
          { ...base, alert_issue_id: 'd', status: 'open', unread: false },
        ])
      )
    )

    const { result } = customRenderHook(() => useUnreadAlertIssuesCount('default'))

    await waitFor(() => expect(result.current).toBe(2))
  })

  it('is zero without a project', () => {
    const { result } = customRenderHook(() => useUnreadAlertIssuesCount(undefined))
    expect(result.current).toBe(0)
  })
})
