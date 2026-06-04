import { describe, expect, it } from 'vitest'

import { getInvokeAuthHeader } from './TerminalInstructions.utils'

describe('getInvokeAuthHeader', () => {
  it('sends a publishable key on the apikey header, not Authorization', () => {
    const header = getInvokeAuthHeader({
      isPublishableKey: true,
      keyValue: 'sb_publishable_abc123',
    })

    expect(header).toBe('apikey: sb_publishable_abc123')
    expect(header).not.toContain('Authorization')
  })

  it('sends a legacy anon key on the Authorization header, not apikey', () => {
    const anonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'
    const header = getInvokeAuthHeader({ isPublishableKey: false, keyValue: anonJwt })

    expect(header).toBe(`Authorization: Bearer ${anonJwt}`)
    expect(header).not.toContain('apikey:')
  })

  it('uses the passed value verbatim, so it works with display placeholders too', () => {
    expect(
      getInvokeAuthHeader({ isPublishableKey: true, keyValue: '[YOUR PUBLISHABLE KEY]' })
    ).toBe('apikey: [YOUR PUBLISHABLE KEY]')
    expect(getInvokeAuthHeader({ isPublishableKey: false, keyValue: '[YOUR ANON KEY]' })).toBe(
      'Authorization: Bearer [YOUR ANON KEY]'
    )
  })
})
