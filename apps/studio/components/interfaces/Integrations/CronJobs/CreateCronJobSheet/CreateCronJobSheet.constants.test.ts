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
})
