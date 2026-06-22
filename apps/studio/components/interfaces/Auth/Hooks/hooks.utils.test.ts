import { describe, expect, it } from 'vitest'

import type { Hook } from './hooks.constants'
import { extractMethod, isValidHook } from './hooks.utils'

const baseHook: Omit<Hook, 'method'> = {
  id: 'send-email',
  title: 'Send Email hook',
  subtitle: 'Will be called by Supabase Auth each time an email message needs to be sent.',
  entitlementKey: 'HOOK_SEND_EMAIL',
  enabled: true,
  enabledKey: 'HOOK_SEND_EMAIL_ENABLED',
  uriKey: 'HOOK_SEND_EMAIL_URI',
  secretsKey: 'HOOK_SEND_EMAIL_SECRETS',
  docSlug: 'send-email-hook',
}

describe('extractMethod', () => {
  it('classifies http auth hook URLs as webhook hooks', () => {
    expect(
      extractMethod('http://host.docker.internal:54321/functions/v1/email_sender', 'secret')
    ).toEqual({
      type: 'https',
      url: 'http://host.docker.internal:54321/functions/v1/email_sender',
      secret: 'secret',
    })
  })

  it('classifies https auth hook URLs as webhook hooks', () => {
    expect(extractMethod('https://example.com/auth/hook', 'secret')).toEqual({
      type: 'https',
      url: 'https://example.com/auth/hook',
      secret: 'secret',
    })
  })

  it('classifies pg-functions auth hook URLs as Postgres hooks', () => {
    expect(extractMethod('pg-functions://postgres/public/custom_access_token_hook')).toEqual({
      type: 'postgres',
      schema: 'public',
      functionName: 'custom_access_token_hook',
    })
  })
})

describe('isValidHook', () => {
  it('accepts http auth hook URLs with a secret', () => {
    expect(
      isValidHook({
        ...baseHook,
        method: {
          type: 'https',
          url: 'http://host.docker.internal:54321/functions/v1/email_sender',
          secret: 'secret',
        },
      })
    ).toBe(true)
  })

  it('rejects webhook URLs without an http or https protocol', () => {
    expect(
      isValidHook({
        ...baseHook,
        method: {
          type: 'https',
          url: 'ftp://example.com/auth/hook',
          secret: 'secret',
        },
      })
    ).toBe(false)
  })
})
