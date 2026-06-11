import { describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { isEmptyResponseBody } = await import('./fetchers')

describe('isEmptyResponseBody', () => {
  it('returns true for a response with no body', async () => {
    const response = new Response(null, { status: 201 })
    expect(await isEmptyResponseBody(response)).toBe(true)
  })

  it('returns true for an empty string body', async () => {
    const response = new Response('', { status: 200 })
    expect(await isEmptyResponseBody(response)).toBe(true)
  })

  it('returns false for a non-empty body', async () => {
    const response = new Response('{"id":1}', { status: 200 })
    expect(await isEmptyResponseBody(response)).toBe(false)
  })

  it('does not drain the original body (reads from a clone)', async () => {
    const response = new Response('{"id":1}', { status: 200 })
    await isEmptyResponseBody(response)
    // The original response must still be readable by openapi-fetch afterwards.
    expect(await response.json()).toEqual({ id: 1 })
  })
})
