import { describe, expect, it } from 'vitest'

import type { ElicitationRequest } from './McpElicitation.types'
import {
  getClientLabel,
  getElicitationCopy,
  getSecretHelperText,
  getSecretPrefixWarning,
} from './McpElicitation.utils'

const request: ElicitationRequest = {
  tool: 'store_secret',
  client: 'Cursor 1.7.2',
  requestedAt: '9:02 AM',
  project: 'billing-staging',
  account: 'ops@example.com',
  keyName: 'resend-key',
  providerHint: { name: 'Resend', prefix: 're_', dashboardUrl: 'https://resend.com/api-keys' },
}

const anonymousRequest: ElicitationRequest = { ...request, client: null, providerHint: undefined }

describe('getClientLabel', () => {
  it('uses the client name when the request identifies one', () => {
    expect(getClientLabel('Claude Code 2.1.4')).toBe('Claude Code 2.1.4')
  })

  it('falls back to a generic label when the client is unknown', () => {
    expect(getClientLabel(null)).toBe('your AI client')
  })
})

describe('getElicitationCopy', () => {
  it('interpolates the key name, project and client into the stored state', () => {
    const copy = getElicitationCopy({ status: 'stored', request, timedOut: false })

    expect(copy.title).toBe('Key stored')
    expect(copy.subtitle).toBe('resend-key is saved for billing-staging.')
    expect(copy.calloutBody).toBe(
      `Go back to Cursor 1.7.2 and choose "I've completed it" to finish the tool call.`
    )
  })

  it('names the generic client when the request has none', () => {
    const copy = getElicitationCopy({ status: 'already-stored', request: anonymousRequest })

    expect(copy.subtitle).toBe(
      'resend-key was saved for billing-staging. Nothing further to do here.'
    )
    expect(copy.calloutBody).toContain('Go back to your AI client')
  })

  it('sends the user back to the agent instead of the client on timeout', () => {
    const copy = getElicitationCopy({ status: 'stored', request, timedOut: true })

    expect(copy.subtitle).toContain('so it may have stopped listening')
    expect(copy.calloutBody).toBe(
      'Ask your agent to store the key again. It will find the saved key and finish without sending you back here.'
    )
  })

  it('gives every terminal state a recovery path and never claims the key was checked', () => {
    const states = [
      { status: 'stored', request, timedOut: false },
      { status: 'stored', request, timedOut: true },
      { status: 'already-stored', request },
      { status: 'expired' },
      { status: 'cancelled' },
      { status: 'paused' },
    ] as const

    for (const state of states) {
      const copy = getElicitationCopy(state)

      expect(copy.calloutTitle).toBe('Next step')
      expect(copy.calloutBody.length).toBeGreaterThan(0)
      expect(copy.footer.length).toBeGreaterThan(0)
    }
  })

  it('never leaks another provider into a request that does not name one', () => {
    const rendered = [
      getElicitationCopy({ status: 'stored', request: anonymousRequest, timedOut: false }),
      getElicitationCopy({ status: 'already-stored', request: anonymousRequest }),
      getElicitationCopy({ status: 'expired' }),
      getElicitationCopy({ status: 'cancelled' }),
      getElicitationCopy({ status: 'paused' }),
    ]
      .flatMap((copy) => Object.values(copy))
      .join(' ')

    expect(rendered).not.toMatch(/openai/i)
    expect(rendered).not.toMatch(/resend(?!-key)/i)
  })
})

describe('getSecretHelperText', () => {
  it('names the project the secret is scoped to', () => {
    expect(getSecretHelperText('acme-prod')).toBe(
      'Stored encrypted for acme-prod. Anyone with write access to this project can use it. Remove it any time from project settings.'
    )
  })
})

describe('getSecretPrefixWarning', () => {
  it('stays quiet while the field is empty', () => {
    expect(getSecretPrefixWarning('', request.providerHint)).toBeUndefined()
  })

  it('stays quiet when the value matches the hinted prefix', () => {
    expect(getSecretPrefixWarning('re_abc123', request.providerHint)).toBeUndefined()
  })

  it('stays quiet when the request carries no provider hint', () => {
    expect(getSecretPrefixWarning('anything', undefined)).toBeUndefined()
  })

  it('stays quiet when the hint has no prefix to compare against', () => {
    expect(getSecretPrefixWarning('anything', { name: 'Acme' })).toBeUndefined()
  })

  it('softly flags a mismatch without blocking the save', () => {
    expect(getSecretPrefixWarning('sk-abc123', request.providerHint)).toBe(
      'Resend keys usually start with re_. You can still save this one.'
    )
  })
})
