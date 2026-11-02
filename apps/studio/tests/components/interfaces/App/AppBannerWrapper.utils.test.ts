import { describe, expect, test } from 'vitest'

import { isOrganizationLandingPath } from '@/components/interfaces/App/AppBannerWrapper.utils'

describe('isOrganizationLandingPath', () => {
  test.each(['/org', '/organizations', '/org/my-org', '/org/my-org/'])('matches %s', (pathname) => {
    expect(isOrganizationLandingPath(pathname)).toBe(true)
  })

  test.each([
    undefined,
    null,
    '',
    '/',
    '/sign-in',
    '/project/abc',
    '/org/abc/general',
    '/organizations/new',
  ])('does not match %s', (pathname) => {
    expect(isOrganizationLandingPath(pathname)).toBe(false)
  })
})
