import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ElicitationRequest } from './McpElicitation.types'
import {
  getElicitationAnnouncement,
  getElicitationCopy,
  getOverwriteWarning,
  getSecretHelperText,
  getSecretPrefixWarning,
} from './McpElicitation.utils'

const request: ElicitationRequest = {
  tool: 'create_edge_function_secret',
  ref: 'abcdefghijklmnopqrst',
  project: 'billing-staging',
  account: 'ops@example.com',
  keyName: 'RESEND_API_KEY',
  providerHint: { name: 'Resend', prefix: 're_', dashboardUrl: 'https://resend.com/api-keys' },
}

const unrecognizedRequest: ElicitationRequest = {
  ...request,
  keyName: 'MY_WEBHOOK_TOKEN',
  providerHint: undefined,
}

describe('getElicitationCopy', () => {
  it('interpolates the key name and project into the stored state', () => {
    const copy = getElicitationCopy({ status: 'stored', request, timedOut: false })

    expect(copy.title).toBe('Key stored')
    expect(copy.subtitle).toBe('RESEND_API_KEY is saved for billing-staging.')
  })

  it('names the generic client, because v1 never learns which one sent the user', () => {
    const copy = getElicitationCopy({ status: 'stored', request, timedOut: false })

    expect(copy.calloutBody).toBe(
      `Go back to your AI client and choose "I've completed it" to finish the tool call.`
    )
  })

  it('sends the user back to the agent instead of the client on timeout', () => {
    const copy = getElicitationCopy({ status: 'stored', request, timedOut: true })

    expect(copy.subtitle).toContain('so it may have stopped listening')
    expect(copy.calloutBody).toBe(
      'Ask your agent to store the key again. It will find the saved key and finish without sending you back here.'
    )
  })

  it('says nothing was stored on the generic error, and offers both ways out', () => {
    const copy = getElicitationCopy({ status: 'error' })

    expect(copy.title).toBe("Couldn't complete this request")
    expect(copy.subtitle).toBe('Nothing was stored.')
    expect(copy.calloutBody).toBe(
      'Ask your agent to run the tool again, or set the key in Edge Functions secrets instead.'
    )
  })

  it('never leaks a failure reason the user cannot act on', () => {
    const copy = getElicitationCopy({ status: 'error' })

    expect(Object.values(copy).join(' ')).not.toMatch(/403|forbidden|permission|error code/i)
  })

  it('gives every terminal state a recovery path and never claims the key was checked', () => {
    const states = [
      { status: 'stored', request, timedOut: false },
      { status: 'stored', request, timedOut: true },
      { status: 'already-stored', request },
      { status: 'expired' },
      { status: 'cancelled' },
      { status: 'paused' },
      { status: 'error' },
    ] as const

    for (const state of states) {
      const copy = getElicitationCopy(state)

      expect(copy.calloutTitle).toBe('Next step')
      expect(copy.calloutBody.length).toBeGreaterThan(0)
      expect(copy.footer.length).toBeGreaterThan(0)
      expect(Object.values(copy).join(' ')).not.toMatch(/valid|verified|works? correctly/i)
    }
  })

  it('never leaks a provider into a request that does not name one', () => {
    const rendered = [
      getElicitationCopy({ status: 'stored', request: unrecognizedRequest, timedOut: false }),
      getElicitationCopy({ status: 'already-stored', request: unrecognizedRequest }),
      getElicitationCopy({ status: 'expired' }),
      getElicitationCopy({ status: 'cancelled' }),
      getElicitationCopy({ status: 'paused' }),
      getElicitationCopy({ status: 'error' }),
    ]
      .flatMap((copy) => Object.values(copy))
      .join(' ')

    expect(rendered).not.toMatch(/openai|anthropic|resend|stripe/i)
  })
})

describe('getSecretHelperText', () => {
  it('names the project the secret is scoped to', () => {
    expect(getSecretHelperText('my-project')).toBe(
      'Stored encrypted for my-project. Anyone with write access to this project can use it. Remove it any time from Edge Functions secrets.'
    )
  })
})

describe('getOverwriteWarning', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-04T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays quiet when the name is not in use', () => {
    expect(getOverwriteWarning(request)).toBeUndefined()
  })

  it('names the key and how long ago it was written', () => {
    const warning = getOverwriteWarning({
      ...request,
      existingSecret: { updatedAt: '2026-09-04T11:58:00Z' },
    })

    expect(warning).toBe(
      'RESEND_API_KEY already exists — updated 2 minutes ago. Storing will replace it.'
    )
  })

  it('reads at seconds and hours granularity too', () => {
    expect(
      getOverwriteWarning({ ...request, existingSecret: { updatedAt: '2026-09-04T11:59:55Z' } })
    ).toContain('updated a few seconds ago')
    expect(
      getOverwriteWarning({ ...request, existingSecret: { updatedAt: '2026-09-04T09:00:00Z' } })
    ).toContain('updated 3 hours ago')
  })

  it('accepts unix microseconds, which the secrets endpoint also returns', () => {
    const twoMinutesAgoInMicros = String(new Date('2026-09-04T11:58:00Z').getTime() * 1000)

    expect(twoMinutesAgoInMicros).toHaveLength(16)
    expect(
      getOverwriteWarning({ ...request, existingSecret: { updatedAt: twoMinutesAgoInMicros } })
    ).toContain('updated 2 minutes ago')
  })

  it('still warns when the platform gave no timestamp', () => {
    expect(getOverwriteWarning({ ...request, existingSecret: { updatedAt: undefined } })).toBe(
      'RESEND_API_KEY already exists. Storing will replace it.'
    )
    expect(getOverwriteWarning({ ...request, existingSecret: { updatedAt: 'not a date' } })).toBe(
      'RESEND_API_KEY already exists. Storing will replace it.'
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

  it('softly flags a mismatch without blocking the store', () => {
    expect(getSecretPrefixWarning('sk-abc123', request.providerHint)).toBe(
      'Resend keys usually start with re_. You can still save this one.'
    )
  })
})

describe('getElicitationAnnouncement', () => {
  it('is empty before anything has resolved, so the region mounts silent', () => {
    // A live region never announces content that was present when it mounted.
    // Rendering nothing first is what makes the first real state a change.
    expect(getElicitationAnnouncement(undefined)).toBe('')
  })

  it('says what is happening while the queries resolve', () => {
    expect(getElicitationAnnouncement({ status: 'loading' })).toBe('Loading request details')
  })

  it('names the key and project once the form is ready', () => {
    expect(getElicitationAnnouncement({ status: 'form', request })).toBe(
      'Ready to save RESEND_API_KEY for billing-staging'
    )
  })

  it('announces the outcome, which the card heading alone never reads out', () => {
    expect(getElicitationAnnouncement({ status: 'stored', request, timedOut: false })).toBe(
      'Key stored. RESEND_API_KEY is saved for billing-staging.'
    )
    expect(getElicitationAnnouncement({ status: 'error' })).toBe(
      "Couldn't complete this request. Nothing was stored."
    )
  })

  it('never repeats the callout, which Admonition already announces via role="alert"', () => {
    const states = [
      { status: 'stored', request, timedOut: false },
      { status: 'already-stored', request },
      { status: 'expired' },
      { status: 'cancelled' },
      { status: 'paused' },
      { status: 'error' },
    ] as const

    for (const state of states) {
      expect(getElicitationAnnouncement(state)).not.toContain(getElicitationCopy(state).calloutBody)
    }
  })

  it('gives every state something to announce', () => {
    const states = [
      { status: 'loading' },
      { status: 'form', request },
      { status: 'wrong-account', signedInAs: 'ops@example.com' },
      { status: 'stored', request, timedOut: true },
      { status: 'already-stored', request },
      { status: 'expired' },
      { status: 'cancelled' },
      { status: 'paused' },
      { status: 'error' },
    ] as const

    for (const state of states) {
      expect(getElicitationAnnouncement(state).length).toBeGreaterThan(0)
    }
  })

  it('does not leak the signed-in account into the wrong-account announcement', () => {
    expect(
      getElicitationAnnouncement({ status: 'wrong-account', signedInAs: 'ops@example.com' })
    ).not.toContain('ops@example.com')
  })
})
