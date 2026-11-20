import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getOrgUsage } from './org-usage-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

function captureUsageRequest() {
  const captured: { searchParams?: URLSearchParams } = {}
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/usage',
    response: ({ request, params }) => {
      expect(params.slug).toBe('test-org')
      captured.searchParams = new URL(request.url).searchParams
      return HttpResponse.json({ usage_billing_enabled: true, usages: [] })
    },
  })
  return captured
}

describe('getOrgUsage', () => {
  it('throws when orgSlug is not provided', async () => {
    await expect(getOrgUsage({ orgSlug: undefined })).rejects.toThrow('orgSlug is required')
  })

  it('sends project_ref and ISO date params when provided', async () => {
    const captured = captureUsageRequest()

    const result = await getOrgUsage({
      orgSlug: 'test-org',
      projectRef: 'test-project-ref',
      start: new Date('2025-01-01T00:00:00.000Z'),
      end: new Date('2025-01-31T23:59:59.000Z'),
    })

    expect(result).toEqual({ usage_billing_enabled: true, usages: [] })
    expect(captured.searchParams?.get('project_ref')).toBe('test-project-ref')
    expect(captured.searchParams?.get('start')).toBe('2025-01-01T00:00:00.000Z')
    expect(captured.searchParams?.get('end')).toBe('2025-01-31T23:59:59.000Z')
  })

  it.each([
    ['projectRef is null', null],
    ['projectRef is undefined', undefined],
  ])('omits optional params when %s and no dates are given', async (_, projectRef) => {
    const captured = captureUsageRequest()

    await getOrgUsage({ orgSlug: 'test-org', projectRef })

    expect(captured.searchParams?.has('project_ref')).toBe(false)
    expect(captured.searchParams?.has('start')).toBe(false)
    expect(captured.searchParams?.has('end')).toBe(false)
  })

  it('surfaces API errors', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/usage',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'API Error' }, { status: 500 }),
    })

    await expect(getOrgUsage({ orgSlug: 'test-org' })).rejects.toThrow('API Error')
  })
})
