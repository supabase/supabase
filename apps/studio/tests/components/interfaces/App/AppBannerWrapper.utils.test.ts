import { describe, expect, test } from 'vitest'

import { isLogsOrObservabilityPath } from '@/components/interfaces/App/AppBannerWrapper.utils'

describe('isLogsOrObservabilityPath', () => {
  test.each([
    '/project/abc/logs',
    '/project/abc/logs/',
    '/project/abc/logs/explorer',
    '/project/abc/observability',
    '/project/abc/observability/query-performance',
  ])('matches %s', (pathname) => {
    expect(isLogsOrObservabilityPath(pathname)).toBe(true)
  })

  test.each([
    undefined,
    null,
    '',
    '/project/abc',
    '/project/abc/editor',
    '/project/abc/logs-explorer',
    '/project/abc/functions/my-fn/logs',
    '/org/abc/logs',
  ])('does not match %s', (pathname) => {
    expect(isLogsOrObservabilityPath(pathname)).toBe(false)
  })
})
