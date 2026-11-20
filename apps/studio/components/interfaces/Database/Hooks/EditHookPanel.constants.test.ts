import { describe, expect, it } from 'vitest'

import { FormSchema } from './EditHookPanel.constants'

const validHook = {
  name: 'Test hook',
  table_id: 'public.messages',
  http_method: 'POST' as const,
  timeout_ms: 1000,
  events: ['INSERT'],
  httpHeaders: [],
  httpParameters: [],
  function_type: 'http_request' as const,
  http_url: 'https://hooks.example.com/webhook',
}

describe('EditHookPanel FormSchema', () => {
  it.each([
    {
      description: 'incomplete http_request hostnames',
      overrides: { http_url: 'https://webhook' },
      message: 'Please provide a valid URL',
    },
    {
      description: 'http_request URLs without an explicit protocol',
      overrides: { http_url: 'hooks.example.com/webhook' },
      message: 'Please prefix your URL with http:// or https://',
    },
    {
      description: 'key-only webhook headers',
      overrides: { httpHeaders: [{ id: 'header-1', name: 'X-Test', value: '' }] },
      message: 'Header value is required',
    },
    {
      description: 'value-only webhook parameters',
      overrides: { httpParameters: [{ id: 'param-1', name: '', value: 'tenant' }] },
      message: 'Parameter name is required',
    },
  ])('rejects $description', ({ overrides, message }) => {
    const result = FormSchema.safeParse({ ...validHook, ...overrides })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message)
  })

  it('accepts a complete http_request hook', () => {
    expect(FormSchema.safeParse(validHook).success).toBe(true)
  })
})
