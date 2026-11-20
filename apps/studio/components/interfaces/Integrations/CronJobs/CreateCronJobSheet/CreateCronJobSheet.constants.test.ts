import { describe, expect, it } from 'vitest'

import { FormSchema } from './CreateCronJobSheet.constants'

const httpRequest = (overrides: {
  endpoint?: string
  httpHeaders?: { name: string; value: string }[]
}) => ({
  type: 'http_request' as const,
  method: 'POST' as const,
  endpoint: 'https://hooks.example.com/webhook',
  timeoutMs: 1000,
  httpHeaders: [],
  snippet: '',
  ...overrides,
})

describe('CreateCronJobSheet FormSchema', () => {
  it.each([
    {
      case: 'incomplete http_request hostnames',
      values: httpRequest({ endpoint: 'https://webhook' }),
      message: 'Please provide a valid URL',
    },
    {
      case: 'http_request URLs without an explicit protocol',
      values: httpRequest({ endpoint: 'hooks.example.com/webhook' }),
      message: 'Please prefix your URL with http:// or https://',
    },
    {
      case: 'key-only http_request headers',
      values: httpRequest({ httpHeaders: [{ name: 'X-Test', value: '' }] }),
      message: 'Header value is required',
    },
    {
      case: 'value-only edge function headers',
      values: {
        type: 'edge_function' as const,
        method: 'POST' as const,
        edgeFunctionName: 'my-function',
        timeoutMs: 1000,
        httpHeaders: [{ name: '', value: 'test-value' }],
        snippet: '',
      },
      message: 'Header name is required',
    },
  ])('rejects $case', ({ values, message }) => {
    const result = FormSchema.safeParse({
      name: 'Job',
      supportsSeconds: false,
      schedule: '* * * * *',
      values,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message)
  })
})
