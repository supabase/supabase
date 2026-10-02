import { EventEmitter } from 'node:events'
import { DatabaseError, type Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import {
  attachPoolErrorHandler,
  createAbortError,
  isConnectionStateError,
  markClientDisposable,
  shouldDisposeClient,
} from './pool-errors'

function createDatabaseError(code: string | undefined, message = 'connection failed') {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}

describe('PostgreSQL pool errors', () => {
  it('attaches caller-owned idle client error handling', () => {
    const pool = new EventEmitter() as Pool
    const onError = vi.fn()
    const error = new Error('idle client failed')

    expect(attachPoolErrorHandler(pool, onError)).toBe(pool)

    pool.emit('error', error)
    expect(onError).toHaveBeenCalledWith(error)
  })

  it.each([
    '08000',
    '08003',
    '08006',
    '08P01',
  ])('recognizes DatabaseError SQLSTATE %s as a connection-state error', (code) => {
    expect(isConnectionStateError(createDatabaseError(code))).toBe(true)
  })

  it.each([
    'received invalid response: 58',
    'Received unexpected authentication request',
    'Unknown authenticationOk message type',
  ])('recognizes PostgreSQL protocol failure %s', (message) => {
    expect(isConnectionStateError(new Error(message))).toBe(true)
  })

  it('does not treat unrelated or plain coded errors as SQLSTATE failures', () => {
    expect(isConnectionStateError(new Error('duplicate key'))).toBe(false)
    expect(isConnectionStateError(Object.assign(new Error('socket'), { code: '08006' }))).toBe(
      false
    )
    expect(isConnectionStateError({ code: '08006' })).toBe(false)
  })

  it('marks exact query errors for disposal and always disposes abort errors', () => {
    const queryError = new Error('bad connection')
    expect(shouldDisposeClient(queryError)).toBe(false)

    markClientDisposable(queryError)

    expect(shouldDisposeClient(queryError)).toBe(true)
    expect(shouldDisposeClient(createAbortError())).toBe(true)
  })

  it('creates a fresh AbortError for each rejected operation', () => {
    const first = createAbortError()
    const second = createAbortError()

    expect(first).toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
      message: 'Query was aborted',
    })
    expect(second).not.toBe(first)
  })
})
