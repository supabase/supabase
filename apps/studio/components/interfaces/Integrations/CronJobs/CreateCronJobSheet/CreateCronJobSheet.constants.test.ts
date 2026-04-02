import { describe, expect, it } from 'vitest'

import { FormSchema } from './CreateCronJobSheet.constants'

describe('CreateCronJobSheet FormSchema', () => {
  it('rejects incomplete http_request hostnames', () => {
    const result = FormSchema.safeParse({
      name: 'Send webhook',
      supportsSeconds: false,
      schedule: '* * * * *',
      values: {
        type: 'http_request' as const,
        method: 'POST' as const,
        endpoint: 'https://webhook',
        timeoutMs: 1000,
        httpHeaders: [],
        snippet: '',
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Please provide a valid URL')
      ).toBe(true)
    }
  })

  it('rejects http_request URLs without an explicit protocol', () => {
    const result = FormSchema.safeParse({
      name: 'Send webhook',
      supportsSeconds: false,
      schedule: '* * * * *',
      values: {
        type: 'http_request' as const,
        method: 'POST' as const,
        endpoint: 'hooks.example.com/webhook',
        timeoutMs: 1000,
        httpHeaders: [],
        snippet: '',
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Please prefix your URL with http:// or https://'
        )
      ).toBe(true)
    }
  })

  it('rejects key-only http_request headers', () => {
    const result = FormSchema.safeParse({
      name: 'Send webhook',
      supportsSeconds: false,
      schedule: '* * * * *',
      values: {
        type: 'http_request' as const,
        method: 'POST' as const,
        endpoint: 'https://hooks.example.com/webhook',
        timeoutMs: 1000,
        httpHeaders: [{ name: 'X-Test', value: '' }],
        snippet: '',
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Header value is required')
      ).toBe(true)
    }
  })

  it('rejects value-only edge function headers', () => {
    const result = FormSchema.safeParse({
      name: 'Invoke edge function',
      supportsSeconds: false,
      schedule: '* * * * *',
      values: {
        type: 'edge_function' as const,
        method: 'POST' as const,
        edgeFunctionName: 'my-function',
        timeoutMs: 1000,
        httpHeaders: [{ name: '', value: 'test-value' }],
        snippet: '',
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Header name is required')).toBe(
        true
      )
    }
  })
})
