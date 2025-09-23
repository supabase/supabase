import { API_URL } from 'lib/constants'
import { test, expect } from 'vitest'

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
