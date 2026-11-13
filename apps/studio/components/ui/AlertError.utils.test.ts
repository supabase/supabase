import { describe, expect, test } from 'vitest'

import {
  formatErrorDetails,
  getErrorPresentation,
  OFFLINE_MESSAGE,
  USER_FAULT_DESCRIPTION,
} from './AlertError.utils'
import {
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  StudioSqlError,
  UnexpectedError,
  UserSqlError,
} from '@/lib/errors/studio-errors'

const now = new Date('2026-01-02T03:04:05.000Z')

describe('formatErrorDetails', () => {
  test('includes the identifying fields', () => {
    const error = new PlatformError({
      message: 'Bad gateway',
      code: 502,
      requestId: 'req-1',
      method: 'GET',
      endpoint: '/platform/projects/{ref}',
    })
    error.errorEventId = 'evt-1'

    expect(formatErrorDetails(error, { subject: 'Failed to load project', now })).toBe(
      [
        'Subject: Failed to load project',
        'Error: PlatformError',
        'Fault: platform',
        'Reason: server_error',
        'HTTP status: 502',
        'Message: Bad gateway',
        'Method: GET',
        'Endpoint: /platform/projects/{ref}',
        'Request ID: req-1',
        'Event ID (before sampling): evt-1',
        'Copied at: 2026-01-02T03:04:05.000Z',
      ].join('\n')
    )
  })

  test('omits absent fields', () => {
    const text = formatErrorDetails(new UnexpectedError({ message: 'boom' }), { now })
    expect(text).not.toMatch(/Subject|HTTP status|Method|Endpoint|Request ID|Event ID/)
    expect(text).toContain('Message: boom')
    expect(text).toContain('Copied at: 2026-01-02T03:04:05.000Z')
  })

  test('excludes formattedError, metadata and cause', () => {
    const error = new PlatformError({
      message: 'oops',
      formattedError: 'FORMATTED-SECRET',
      metadata: { cost: 1, sql: 'select SECRET_SQL' },
      cause: new Error('CAUSE-SECRET'),
    })
    const text = formatErrorDetails(error, { now })
    expect(text).not.toMatch(/FORMATTED-SECRET|SECRET_SQL|CAUSE-SECRET/)
  })

  test('UserSqlError omits the message and keeps the SQL state', () => {
    const error = new UserSqlError({
      message: 'relation "secret_table" does not exist',
      sqlState: '42P01',
      position: '15',
    })
    const text = formatErrorDetails(error, { now })
    expect(text).not.toContain('secret_table')
    expect(text).not.toContain('Message:')
    expect(text).toContain('SQL state: 42P01')
    expect(text).toContain('Position: 15')
  })

  test('StudioSqlError omits the message and keeps SQL state, position and query name', () => {
    const error = new StudioSqlError({
      message: 'duplicate key value violates unique constraint (email)=(a@b.c)',
      sqlState: '23505',
      position: '3',
      queryName: 'table-rows',
    })
    const text = formatErrorDetails(error, { now })
    expect(text).not.toContain('a@b.c')
    expect(text).not.toContain('Message:')
    expect(text).toContain('SQL state: 23505')
    expect(text).toContain('Position: 3')
    expect(text).toContain('Query name: table-rows')
  })
})

describe('getErrorPresentation', () => {
  test('offline replaces the message and hides instructions, support and details', () => {
    const presentation = getErrorPresentation(
      new NetworkUnreachableError({ message: 'Unable to reach', reason: 'offline' })
    )
    expect(presentation).toEqual({
      message: OFFLINE_MESSAGE,
      showInstructions: false,
      hideContactSupport: true,
      showDetails: false,
    })
  })

  test.each([
    ['UserSqlError', new UserSqlError({ message: 'x' })],
    ['RequestAborted', new RequestAbortedError({})],
    ['StudioSqlError (user_input)', new StudioSqlError({ message: 'x', reason: 'user_input' })],
  ])('%s says to try again, with no support or details', (_, error) => {
    expect(getErrorPresentation(error)).toEqual({
      description: USER_FAULT_DESCRIPTION,
      showInstructions: true,
      hideContactSupport: true,
      showDetails: false,
    })
  })

  test.each([
    ['PlatformError', new PlatformError({})],
    ['StudioSqlError (studio_sql)', new StudioSqlError({ message: 'x' })],
    ['NetworkUnreachable (not offline)', new NetworkUnreachableError({ message: 'x' })],
  ])('%s keeps the defaults and shows details', (_, error) => {
    expect(getErrorPresentation(error)).toEqual({
      showInstructions: true,
      hideContactSupport: false,
      showDetails: true,
    })
  })
})
