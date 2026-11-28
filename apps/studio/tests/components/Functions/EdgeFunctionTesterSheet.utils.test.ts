import { zodResolver } from '@hookform/resolvers/zod'
import { describe, expect, it } from 'vitest'

import {
  buildEdgeFunctionTestHeaders,
  edgeFunctionTestFormSchema,
} from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet.utils'

const PUBLISHABLE_KEY = 'sb_publishable_test_key'

describe('edgeFunctionTestFormSchema', () => {
  const values = {
    method: 'POST' as const,
    body: '{"name":"Functions"}',
    headers: [],
    queryParams: [],
  }

  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])(
    'validates the body for %s requests',
    (method) => {
      expect(
        edgeFunctionTestFormSchema.safeParse({ ...values, method, body: '{"name":' }).success
      ).toBe(false)
    }
  )

  it.each(['{"name":', '{"name":"Functions",}', 'plain text', '   '])(
    'rejects malformed JSON: %j',
    (body) => {
      const result = edgeFunctionTestFormSchema.safeParse({ ...values, body })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual([
          expect.objectContaining({ path: ['body'], message: 'Enter a valid JSON body' }),
        ])
      }
    }
  )

  it.each(['{}', '[1,2]', 'null', 'true', '42', '"hello"'])('accepts valid JSON: %j', (body) => {
    expect(edgeFunctionTestFormSchema.safeParse({ ...values, body }).success).toBe(true)
  })

  it.each(['', undefined])('preserves the empty body default for %j', (body) => {
    expect(edgeFunctionTestFormSchema.parse({ ...values, body }).body).toBe('{}')
  })

  it.each(['GET', 'HEAD'])('ignores the body for %s requests', (method) => {
    expect(
      edgeFunctionTestFormSchema.safeParse({ ...values, method, body: 'not JSON' }).success
    ).toBe(true)
  })

  it.each(['application/json', 'Application/JSON; charset=utf-8', 'application/problem+json'])(
    'validates JSON for Content-Type %s',
    (contentType) => {
      expect(
        edgeFunctionTestFormSchema.safeParse({
          ...values,
          body: 'not JSON',
          headers: [{ key: 'content-TYPE', value: contentType }],
        }).success
      ).toBe(false)
    }
  )

  it('allows plain text when the last Content-Type overrides JSON', () => {
    expect(
      edgeFunctionTestFormSchema.safeParse({
        ...values,
        body: 'plain text payload',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: ' content-type ', value: 'text/plain' },
        ],
      }).success
    ).toBe(true)
  })

  it('keeps JSON validation when an incomplete Content-Type row is ignored', () => {
    expect(
      edgeFunctionTestFormSchema.safeParse({
        ...values,
        body: 'not JSON',
        headers: [{ key: 'content-type', value: '' }],
      }).success
    ).toBe(false)
  })

  it('clears the body error after correcting the JSON or switching to plain text', async () => {
    const resolve = zodResolver(edgeFunctionTestFormSchema)
    const options = { fields: {}, shouldUseNativeValidation: false }
    const invalidValues = { ...values, body: '{"name":' }

    const invalid = await resolve(invalidValues, {}, options)
    expect(invalid.errors.body?.message).toBe('Enter a valid JSON body')

    const corrected = await resolve(values, {}, options)
    expect(corrected.errors).toEqual({})

    const plainText = await resolve(
      { ...invalidValues, headers: [{ key: 'Content-Type', value: 'text/plain' }] },
      {},
      options
    )
    expect(plainText.errors).toEqual({})
  })
})

describe('buildEdgeFunctionTestHeaders', () => {
  it('sends the API key on the apikey header', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
    })
  })

  it('never generates an Authorization header', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [{ key: '', value: '' }],
    })

    expect(headers.Authorization).toBeUndefined()
    expect(headers.authorization).toBeUndefined()
  })

  it('omits apikey when no key is available', () => {
    const headers = buildEdgeFunctionTestHeaders({ apiKey: undefined, customHeaders: [] })

    expect(headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('keeps the apikey alongside several user rows', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [
        { key: 'Authorization', value: 'Bearer user-token' },
        { key: 'x-custom', value: 'kept' },
      ],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      Authorization: 'Bearer user-token',
      'x-custom': 'kept',
    })
  })

  it('lets a user row replace a generated header whatever its casing', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [
        { key: 'Apikey', value: 'sb_secret_manual_key' },
        { key: 'content-type', value: 'text/plain' },
      ],
    })

    expect(headers).toEqual({
      Apikey: 'sb_secret_manual_key',
      'content-type': 'text/plain',
    })
  })

  it('trims header names and drops incomplete rows', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [
        { key: '  x-spaced  ', value: 'value' },
        { key: 'x-no-value', value: '' },
        { key: '   ', value: 'orphan' },
      ],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      'x-spaced': 'value',
    })
  })
})
