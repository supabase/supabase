import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ASSISTANT_OAUTH_COMPLETE_TYPE,
  assistantApiOrigin,
  readAssistantOAuthCompleteMessage,
} from './assistant-oauth'

describe('assistantApiOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the origin of the assistant API URL', () => {
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', 'http://localhost:8787/v1')
    expect(assistantApiOrigin()).toBe('http://localhost:8787')
  })
})

describe('readAssistantOAuthCompleteMessage', () => {
  const expectedOrigin = 'http://localhost:8787'

  it('accepts a matching origin and payload', () => {
    expect(
      readAssistantOAuthCompleteMessage(
        {
          origin: expectedOrigin,
          data: { type: ASSISTANT_OAUTH_COMPLETE_TYPE, org_slug: 'acme' },
        },
        expectedOrigin
      )
    ).toEqual({ type: ASSISTANT_OAUTH_COMPLETE_TYPE, org_slug: 'acme' })
  })

  it('rejects a different origin', () => {
    expect(
      readAssistantOAuthCompleteMessage(
        {
          origin: 'https://evil.example',
          data: { type: ASSISTANT_OAUTH_COMPLETE_TYPE, org_slug: 'acme' },
        },
        expectedOrigin
      )
    ).toBeNull()
  })

  it('rejects a missing org_slug or unexpected type', () => {
    expect(
      readAssistantOAuthCompleteMessage(
        { origin: expectedOrigin, data: { type: ASSISTANT_OAUTH_COMPLETE_TYPE } },
        expectedOrigin
      )
    ).toBeNull()
    expect(
      readAssistantOAuthCompleteMessage(
        { origin: expectedOrigin, data: { type: 'other', org_slug: 'acme' } },
        expectedOrigin
      )
    ).toBeNull()
  })
})
