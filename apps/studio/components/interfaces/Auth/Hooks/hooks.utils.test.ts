import { describe, expect, test } from 'vitest'

import { extractMethod, isValidHook } from './hooks.utils'
import { HOOKS_DEFINITIONS, type Hook } from './hooks.constants'

describe('Auth Hooks utils', () => {
  test('treats the documented self-hosted Send Email HTTP URI as an HTTP hook', () => {
    const uri = 'http://host.docker.internal:54321/functions/v1/email_sender'
    const secret = 'v1,whsec_test'

    const method = extractMethod(uri, secret)

    expect(method).toEqual({ type: 'https', url: uri, secret })
    expect(method).not.toMatchObject({ type: 'postgres', schema: 'functions', functionName: 'v1' })

    const hook: Hook = {
      ...HOOKS_DEFINITIONS[0],
      enabled: true,
      method,
    }
    expect(isValidHook(hook)).toBe(true)
  })

  test('treats HTTPS URIs as HTTP hooks', () => {
    const uri = 'https://example.com/auth-hook'
    const secret = 'v1,whsec_test'

    expect(extractMethod(uri, secret)).toEqual({ type: 'https', url: uri, secret })
  })

  test('treats pg-functions URIs as Postgres hooks', () => {
    expect(extractMethod('pg-functions://postgres/public/custom_access_token')).toEqual({
      type: 'postgres',
      schema: 'public',
      functionName: 'custom_access_token',
    })
  })
})
