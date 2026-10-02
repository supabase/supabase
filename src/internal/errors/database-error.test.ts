import { DatabaseError } from 'pg'
import { DBError } from '../../storage/database/errors'
import { ERRORS } from './codes'
import { isDatabaseSlowDownError } from './database-error'
import { StorageBackendError } from './storage-error'

function databaseError(message: string): DatabaseError {
  return new DatabaseError(message, message.length, 'error')
}

describe('isDatabaseSlowDownError', () => {
  it('matches cached server login failures with provider-specific suffixes', () => {
    const messages = [
      'server login has been failing, cached error: connect timeout (server_login_retry)',
      'server login has been failing, cached error: the database system is not accepting connections',
      'server login has been failing, cached error: pgbouncer cannot connect to server',
    ]

    for (const message of messages) {
      expect(isDatabaseSlowDownError(databaseError(message))).toBe(true)
    }
  })

  it('does not match unrelated database errors', () => {
    const messages = [
      'relation "objects" does not exist',
      'duplicate key value violates unique constraint "objects_pkey"',
      'syntax error at or near "from"',
    ]

    for (const message of messages) {
      expect(isDatabaseSlowDownError(databaseError(message))).toBe(false)
    }
  })

  it('does not match slowdown text on non-database errors', () => {
    expect(
      isDatabaseSlowDownError(
        new Error('server login has been failing, cached error: connect timeout')
      )
    ).toBe(false)
  })

  it('matches wrapped database errors with slowdown messages', () => {
    const error = databaseError('no more connections allowed (max_client_conn)')
    error.code = '08P01'

    expect(isDatabaseSlowDownError(DBError.fromDBError(error))).toBe(true)
  })

  it('does not match wrapped database errors without slowdown messages', () => {
    const error = databaseError('received invalid response: 58')
    error.code = '08P01'

    expect(isDatabaseSlowDownError(DBError.fromDBError(error))).toBe(false)
  })

  it('does not match storage errors without wrapped database errors', () => {
    const error = ERRORS.DatabaseError('database error, code: 08P01') as StorageBackendError

    expect(isDatabaseSlowDownError(error)).toBe(false)
  })
})
