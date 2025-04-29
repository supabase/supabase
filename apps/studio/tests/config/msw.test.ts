import { API_URL } from 'lib/constants'
import { test, expect } from 'vitest'
import { API_LOGS_MOCK } from '../mocks/api/logs'

test('MSW works as expected', async () => {
  const res = await fetch(`${API_URL}/msw/test`)
  const json = await res.json()

  expect(res.status).toBe(200)
  expect(json).toEqual({ message: 'Hello from MSW!' })
})

test('MSW errors on missing endpoints', async () => {
  expect(async () => {
    const res = await fetch(`${API_URL}/endpoint-that-doesnt-exist`)
    const json = await res.json()
    expect(json).toEqual({ message: '🚫 MSW missed' })
  })
})

test('MSW returns mock for /logs.all', async () => {
  const res = await fetch(
    `/api/platform/projects/default/analytics/endpoints/logs.all?from=123&to=456`
  )
  const json = await res.json()

  expect(res.status).toBe(200)
  expect(json).toEqual(API_LOGS_MOCK)
})
