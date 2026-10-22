import { describe, expect, it } from 'vitest'

import { getAuthRedirectSearch } from './withAuth.utils'

describe('authentication return destination', () => {
  it('preserves the recovery page and its nested dashboard destination', () => {
    const search = '?returnTo=%2Fproject%2Fref%3Ftab%3D1%23table'
    const result = new URLSearchParams(getAuthRedirectSearch('/account-recovery', search, ''))
    expect(result.get('returnTo')).toBe(`/account-recovery${search}`)
  })
  it('preserves ordinary query parameters and fragments', () => {
    const result = new URLSearchParams(getAuthRedirectSearch('/project/ref', '?tab=1', '#table'))
    expect(result.get('returnTo')).toBe('/project/ref?tab=1#table')
    expect(result.get('tab')).toBe('1')
  })
})
