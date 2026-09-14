import { describe, expect, it } from 'vitest'

import { parseRedirectMessage, shouldShowAddPasswordRow } from './AccountIdentities.utils'

describe('parseRedirectMessage', () => {
  it('drops the trailing sb marker and decodes + as spaces', () => {
    expect(
      parseRedirectMessage(
        '/account/me#message=Confirmation+link+accepted.+Please+proceed+to+confirm+link+sent+to+the+other+email&sb='
      )
    ).toBe('Confirmation link accepted. Please proceed to confirm link sent to the other email')
  })

  it('returns undefined when there is no hash', () => {
    expect(parseRedirectMessage('/account/me')).toBeUndefined()
  })

  it('returns undefined when the fragment has no message key', () => {
    expect(parseRedirectMessage('/account/me#sb=')).toBeUndefined()
  })

  it('finds message even when it is not the first fragment param', () => {
    expect(parseRedirectMessage('/account/me#sb=&message=Hi+there')).toBe('Hi there')
  })

  it('preserves a literal + via percent-encoding', () => {
    expect(parseRedirectMessage('/account/me#message=a%2Bb&sb=')).toBe('a+b')
  })
})

describe('shouldShowAddPasswordRow', () => {
  const email = 'user@example.com'

  it('shows the row for an OAuth-only user', () => {
    expect(shouldShowAddPasswordRow({ identities: [{ provider: 'github' }], email })).toBe(true)
  })

  it('shows the row when there are no identities at all', () => {
    expect(shouldShowAddPasswordRow({ identities: [], email })).toBe(true)
  })

  it('hides the row when an email identity already exists', () => {
    expect(shouldShowAddPasswordRow({ identities: [{ provider: 'email' }], email })).toBe(false)
    expect(
      shouldShowAddPasswordRow({
        identities: [{ provider: 'github' }, { provider: 'email' }],
        email,
      })
    ).toBe(false)
  })

  it('hides the row for SSO users', () => {
    expect(
      shouldShowAddPasswordRow({
        identities: [{ provider: 'sso:4d21b3cf-3a2f-44d3-b7d6-2b0dd393f671' }],
        email,
      })
    ).toBe(false)
    expect(
      shouldShowAddPasswordRow({
        identities: [{ provider: 'github' }, { provider: 'sso' }],
        email,
      })
    ).toBe(false)
  })

  it('hides the row when the user has no email', () => {
    expect(
      shouldShowAddPasswordRow({ identities: [{ provider: 'github' }], email: undefined })
    ).toBe(false)
    expect(shouldShowAddPasswordRow({ identities: [{ provider: 'github' }], email: '' })).toBe(
      false
    )
  })
})
