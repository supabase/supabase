import { describe, expect, test } from 'vitest'

import { handleWarehouseV2Error } from './warehouse-v2-error'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { V2APIErrorBody } from '@/tests/lib/msw'

const catchError = (error: unknown) => {
  try {
    handleWarehouseV2Error(error)
  } catch (thrown) {
    if (isStudioError(thrown)) return thrown
    throw thrown
  }
  throw new Error('Expected handleWarehouseV2Error to throw')
}

// What the fetch layer hands over for a failed v2 request: the response body plus the HTTP status.
const v2Error = (status: number, error: V2APIErrorBody['error']) => ({
  code: status,
  requestId: 'req-1',
  error,
})

describe('handleWarehouseV2Error', () => {
  test('shows the description rather than the fixed title of the error code', () => {
    const error = catchError(
      v2Error(400, {
        code: 'warehouse_setup_invalid',
        message: 'Warehouse setup configuration is invalid',
        description: 'Project must be active and healthy.',
      })
    )

    expect(error.message).toBe('Project must be active and healthy.')
  })

  test.each([undefined, ''])(
    'falls back to the message when the description is %j',
    (description) => {
      const error = catchError(
        v2Error(400, {
          code: 'warehouse_selection_empty',
          message: 'No eligible source tables were selected',
          description,
        })
      )

      expect(error.message).toBe('No eligible source tables were selected')
    }
  )

  test.each([
    [409, 'warehouse_lifecycle_conflict', 'UnclassifiedApiError'],
    [503, 'warehouse_setup_unavailable', 'PlatformError'],
  ])('keeps the HTTP status of a %i so the error is classified by it', (status, code, tag) => {
    const error = catchError(v2Error(status, { code, message: 'Warehouse request failed' }))

    expect(error).toMatchObject({ _tag: tag, code: status, requestId: 'req-1' })
  })

  test('passes an error without the v2 envelope through unchanged', () => {
    const error = catchError({ message: 'Warehouse status request timed out', code: 544 })

    expect(error).toMatchObject({ message: 'Warehouse status request timed out', code: 544 })
  })
})
