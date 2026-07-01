import { describe, expect, it } from 'vitest'

import { parseRedirectMessage } from './AccountIdentities.utils'

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
