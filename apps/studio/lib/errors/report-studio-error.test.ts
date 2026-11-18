import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SAMPLE_USER_FAULT } from './error-routing'
import { reportStudioError } from './report-studio-error'
import { PlatformError, StudioSqlError, UserSqlError } from './studio-errors'

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn(() => 'event-id') }))
vi.mock('@sentry/react', () => ({ captureException }))

beforeEach(() => {
  captureException.mockClear()
})

describe('reportStudioError', () => {
  it('never reports a UserSqlError, even when forced', () => {
    const error = new UserSqlError({})
    reportStudioError(error, undefined, { force: true })
    reportStudioError(error)
    expect(captureException).not.toHaveBeenCalled()
    expect(error.errorEventId).toBeUndefined()
  })

  it('tags the reason and the routed rate for its fault', () => {
    reportStudioError(new StudioSqlError({ reason: 'user_input', sqlState: '22P02' }))
    if (SAMPLE_USER_FAULT === 0) {
      expect(captureException).not.toHaveBeenCalled()
      return
    }
    expect(captureException).toHaveBeenCalledWith(
      expect.any(StudioSqlError),
      expect.objectContaining({
        tags: expect.objectContaining({
          reason: 'user_input',
          fault: 'user',
          sample_rate: SAMPLE_USER_FAULT,
        }),
      })
    )
  })

  it('lets force override routing for a non-private error', () => {
    const error = new StudioSqlError({ reason: 'user_input' })
    reportStudioError(error, undefined, { force: true })
    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ tags: expect.objectContaining({ sample_rate: 1 }) })
    )
    expect(error.errorEventId).toBe('event-id')
  })

  it('tags the reason on a platform error', () => {
    reportStudioError(new PlatformError({}))
    expect(captureException).toHaveBeenCalledWith(
      expect.any(PlatformError),
      expect.objectContaining({ tags: expect.objectContaining({ reason: 'server_error' }) })
    )
  })
})
