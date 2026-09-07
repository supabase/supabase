import { describe, expect, it } from 'vitest'

import { assistantApiOrigin, readAssistantOAuthCode } from './oauth'

describe('browser OAuth completion binding', () => {
  const popup = {}
  const expected = { origin: 'https://assistant.example', popup, state: 'browser-state' }
  const event = {
    origin: expected.origin,
    source: popup,
    data: { type: 'assistant-oauth-code', state: expected.state, code: 'code' },
  }
  it('accepts only the initiating popup, origin, state, and protocol', () => {
    expect(readAssistantOAuthCode(event, expected)).toBe('code')
    for (const changed of [
      { ...event, source: {} },
      { ...event, origin: 'https://attacker.example' },
      { ...event, data: { ...event.data, state: 'another-browser' } },
      { ...event, data: { type: 'assistant-oauth-complete', org_slug: 'org' } },
      { ...event, data: {} },
    ])
      expect(readAssistantOAuthCode(changed, expected)).toBeUndefined()
  })
  it('derives the exact worker origin and rejects invalid URLs', () => {
    expect(assistantApiOrigin('https://assistant.example/path')).toBe(expected.origin)
    expect(assistantApiOrigin('invalid')).toBeUndefined()
  })
})
