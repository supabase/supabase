import { describe, expect, it } from 'vitest'

import { isSingleOAuthIdentity } from './single-oauth-identity'

const email = 'person@example.com'

describe('isSingleOAuthIdentity', () => {
  it('is true for a lone OAuth provider with an email', () => {
    expect(isSingleOAuthIdentity({ identities: [{ provider: 'github' }], email })).toBe(true)
  })

  it.each(['email', 'phone', 'sso:4d21b3cf-3a2f-44d3-b7d6-2b0dd393f671'])(
    'is false for a lone %s identity',
    (provider) => {
      expect(isSingleOAuthIdentity({ identities: [{ provider }], email })).toBe(false)
    }
  )

  it('is false with several identities or no email', () => {
    expect(
      isSingleOAuthIdentity({ identities: [{ provider: 'github' }, { provider: 'google' }], email })
    ).toBe(false)
    expect(isSingleOAuthIdentity({ identities: [{ provider: 'github' }], email: undefined })).toBe(
      false
    )
    expect(isSingleOAuthIdentity({ identities: [], email })).toBe(false)
  })
})
