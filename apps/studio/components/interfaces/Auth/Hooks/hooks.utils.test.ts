import { describe, expect, it } from 'vitest'

import { extractMethod, isHttpHookUrl, isValidHook } from './hooks.utils'

describe('hooks.utils', () => {
  it('classifies the documented self-hosted send email hook as an HTTP hook', () => {
    expect(
      extractMethod(
        'http://host.docker.internal:54321/functions/v1/email_sender',
        'v1,whsec_example'
      )
    ).toEqual({
      type: 'http',
      url: 'http://host.docker.internal:54321/functions/v1/email_sender',
      secret: 'v1,whsec_example',
    })
  })

  it('classifies https hook URLs as HTTP hooks too', () => {
    expect(extractMethod('https://example.com/hooks/send-email', 'v1,whsec_example')).toEqual({
      type: 'http',
      url: 'https://example.com/hooks/send-email',
      secret: 'v1,whsec_example',
    })
  })

  it('accepts both http and https hook URLs', () => {
    expect(isHttpHookUrl('http://host.docker.internal:54321/functions/v1/email_sender')).toBe(true)
    expect(isHttpHookUrl('https://example.com/hooks/send-email')).toBe(true)
    expect(isHttpHookUrl('pg-functions://postgres/public/send_email')).toBe(false)
  })

  it('keeps Postgres hook URIs on the postgres branch', () => {
    expect(extractMethod('pg-functions://postgres/public/custom_access_token_hook')).toEqual({
      type: 'postgres',
      schema: 'public',
      functionName: 'custom_access_token_hook',
    })
  })

  it('falls back to an empty postgres hook for blank URIs without throwing', () => {
    expect(() => extractMethod('')).not.toThrow()
    expect(extractMethod('')).toEqual({
      type: 'postgres',
      schema: '',
      functionName: '',
    })
  })

  it('treats HTTP hooks with a secret as valid hooks', () => {
    expect(
      isValidHook({
        id: 'send-email',
        title: 'Send Email hook',
        subtitle: '',
        entitlementKey: 'HOOK_SEND_EMAIL',
        enabled: true,
        enabledKey: 'HOOK_SEND_EMAIL_ENABLED',
        uriKey: 'HOOK_SEND_EMAIL_URI',
        secretsKey: 'HOOK_SEND_EMAIL_SECRETS',
        docSlug: 'send-email-hook',
        method: {
          type: 'http',
          url: 'http://host.docker.internal:54321/functions/v1/email_sender',
          secret: 'v1,whsec_example',
        },
      })
    ).toBe(true)
  })
})
