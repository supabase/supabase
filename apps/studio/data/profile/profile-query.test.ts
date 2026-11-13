import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProfile } from './profile-query'
import { reportQueryError } from '@/lib/errors/report-studio-error'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const captureException = vi.hoisted(() => vi.fn(() => 'event-123'))
vi.mock('@sentry/nextjs', () => ({ captureException }))

function mockProfileError(message: string, status: number) {
  addAPIMock({
    method: 'get',
    path: '/platform/profile',
    response: () => HttpResponse.json<APIErrorBody>({ message }, { status }),
  })
}

async function getProfileError() {
  try {
    await getProfile()
  } catch (error) {
    return error
  }
  throw new Error('getProfile did not throw')
}

beforeEach(() => {
  captureException.mockClear()
})

describe('getProfile', () => {
  it.each([
    ['401', 'No access token provided', 401],
    ['403', 'Insufficient AAL: MFA required', 403],
    ['404', "User's profile not found", 404],
  ])('throws an expected %s without reporting it to Sentry', async (_, message, status) => {
    mockProfileError(message, status)

    const error = await getProfileError()
    expect(error).toMatchObject({ _tag: 'UnclassifiedApiError', code: status, message })

    reportQueryError(error)
    expect(captureException).not.toHaveBeenCalled()
  })

  it.each([
    ['400', 'Bad request', 400, 'UnclassifiedApiError'],
    ['500', 'Internal error', 500, 'PlatformError'],
  ])('reports any other %s after the last retry', async (_, message, status, tag) => {
    mockProfileError(message, status)

    const error = await getProfileError()
    expect(error).toMatchObject({ _tag: tag, code: status })

    reportQueryError(error)
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledWith(error, expect.anything())
  })
})
