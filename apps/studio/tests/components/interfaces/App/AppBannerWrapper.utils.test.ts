import { describe, expect, test } from 'vitest'

import {
  isLogsOrObservabilityPath,
  isOrganizationLandingPath,
} from '@/components/interfaces/App/AppBannerWrapper.utils'

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

describe('isOrganizationLandingPath', () => {
  test.each(['/org', '/organizations', '/org/my-org', '/org/my-org/'])('matches %s', (pathname) => {
    expect(isOrganizationLandingPath(pathname)).toBe(true)
  })

  test.each([undefined, null, '', '/project/abc', '/org/my-org/general', '/organizations/new'])(
    'does not match %s',
    (pathname) => {
      expect(isOrganizationLandingPath(pathname)).toBe(false)
    }
  )
})
