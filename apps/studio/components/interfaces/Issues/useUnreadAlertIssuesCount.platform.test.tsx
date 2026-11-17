import { describe, expect, it } from 'vitest'

import { useUnreadAlertIssuesCount } from './useUnreadAlertIssuesCount'
import { customRenderHook } from '@/tests/lib/custom-render'

describe('useUnreadAlertIssuesCount on the platform', () => {
  it('is zero and does not request alert issues', () => {
    // Any request would fail the test: unhandled requests error in the MSW setup.
    const { result } = customRenderHook(() => useUnreadAlertIssuesCount('default'))
    expect(result.current).toBe(0)
  })
})
