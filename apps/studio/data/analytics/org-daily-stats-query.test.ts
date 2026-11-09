import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getOrgDailyStats } from './org-daily-stats-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const variables = { orgSlug: 'test-org', startDate: '2025-01-01', endDate: '2025-01-31' }

describe('getOrgDailyStats', () => {
  it.each([
    [{ orgSlug: undefined }, 'Org slug is required'],
    [{ startDate: undefined }, 'Start date is required'],
    // Product currently reuses the start-date message for a missing end date.
    [{ endDate: undefined }, 'Start date is required'],
  ])('rejects when a required variable is missing: %o', async (override, message) => {
    await expect(getOrgDailyStats({ ...variables, ...override })).rejects.toThrow(message)
  })

  it.each([
    ['includes project_ref when provided', 'test-project-ref'],
    ['omits project_ref when not provided', undefined],
  ])('%s', async (_, projectRef) => {
    let searchParams: URLSearchParams | undefined
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/usage/daily',
      response: ({ request, params }) => {
        expect(params.slug).toBe('test-org')
        searchParams = new URL(request.url).searchParams
        return HttpResponse.json({ usages: [] })
      },
    })

    const result = await getOrgDailyStats({ ...variables, projectRef })

    expect(result).toEqual({ usages: [] })
    expect(searchParams?.get('start')).toBe('2025-01-01')
    expect(searchParams?.get('end')).toBe('2025-01-31')
    expect(searchParams?.get('project_ref')).toBe(projectRef ?? null)
  })

  it('surfaces API errors', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/usage/daily',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'API Error' }, { status: 500 }),
    })

    await expect(getOrgDailyStats(variables)).rejects.toThrow('API Error')
  })
})
