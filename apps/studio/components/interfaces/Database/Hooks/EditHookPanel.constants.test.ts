import { describe, expect, it } from 'vitest'

import { FormSchema } from './EditHookPanel.constants'

describe('EditHookPanel FormSchema', () => {
  it('rejects incomplete http_request hostnames', () => {
    const result = FormSchema.safeParse({
      name: 'Test hook',
      table_id: 'public.messages',
      http_method: 'POST' as const,
      timeout_ms: 1000,
      events: ['INSERT'],
      httpHeaders: [],
      httpParameters: [],
      function_type: 'http_request' as const,
      http_url: 'https://webhook',
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
      name: 'Test hook',
      table_id: 'public.messages',
      http_method: 'POST' as const,
      timeout_ms: 1000,
      events: ['INSERT'],
      httpHeaders: [],
      httpParameters: [],
      function_type: 'http_request' as const,
      http_url: 'hooks.example.com/webhook',
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

  it('rejects key-only webhook headers', () => {
    const result = FormSchema.safeParse({
      name: 'Test hook',
      table_id: 'public.messages',
      http_method: 'POST' as const,
      timeout_ms: 1000,
      events: ['INSERT'],
      httpHeaders: [{ id: 'header-1', name: 'X-Test', value: '' }],
      httpParameters: [],
      function_type: 'http_request' as const,
      http_url: 'https://hooks.example.com/webhook',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Header value is required')
      ).toBe(true)
    }
  })

  it('rejects value-only webhook parameters', () => {
    const result = FormSchema.safeParse({
      name: 'Test hook',
      table_id: 'public.messages',
      http_method: 'POST' as const,
      timeout_ms: 1000,
      events: ['INSERT'],
      httpHeaders: [],
      httpParameters: [{ id: 'param-1', name: '', value: 'tenant' }],
      function_type: 'http_request' as const,
      http_url: 'https://hooks.example.com/webhook',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Parameter name is required')
      ).toBe(true)
    }
  })
})
