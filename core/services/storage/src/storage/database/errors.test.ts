import { DatabaseError } from 'pg'
import { DBError, mapPgTransactionAbortedError } from './errors'

describe('DBError', () => {
  test('preserves non-RLS permission failure messages', () => {
    const error = createPgError('42501', 'permission denied for table objects')

    expect(DBError.fromDBError(error, 'SELECT * FROM storage.objects')).toMatchObject({
      code: 'AccessDenied',
      message: 'permission denied for table objects',
      originalError: error,
      metadata: {
        query: 'SELECT * FROM storage.objects',
        code: '42501',
      },
    })
  })

  test('normalizes RLS permission failures', () => {
    const error = createPgError('42501', 'new row violates row-level security policy for table')

    expect(DBError.fromDBError(error, 'INSERT INTO storage.objects')).toMatchObject({
      code: 'AccessDenied',
      message: 'new row violates row-level security policy',
      originalError: error,
      metadata: {
        query: 'INSERT INTO storage.objects',
        code: '42501',
      },
    })
  })

  test('maps aborted transactions to a typed database error', () => {
    const error = createPgError('25P02', 'current transaction is aborted')

    expect(DBError.fromDBError(error, 'SAVEPOINT "storage_pg_query_1"')).toMatchObject({
      code: 'DatabaseTransactionAborted',
      message:
        'The database transaction has been aborted. Roll back the transaction before retrying.',
      originalError: error,
      metadata: {
        query: 'SAVEPOINT "storage_pg_query_1"',
        code: '25P02',
      },
    })
  })

  test('maps aborted transaction errors at savepoint acquisition boundaries', () => {
    const error = createPgError('25P02', 'current transaction is aborted')

    expect(
      mapPgTransactionAbortedError(error, 'SAVEPOINT "iceberg_pg_transaction_1"')
    ).toMatchObject({
      code: 'DatabaseTransactionAborted',
      originalError: error,
      metadata: {
        query: 'SAVEPOINT "iceberg_pg_transaction_1"',
        code: '25P02',
      },
    })
  })

  test('curates metadata to query, code, and pgMessage for connection-class errors', () => {
    const error = createPgError('08P01', 'no more connections allowed (max_client_conn)')
    error.severity = 'FATAL'
    error.schema = 'storage'
    error.table = 'objects'
    error.column = 'name'
    error.dataType = 'text'
    error.constraint = 'objects_bucket_id_name_key'
    error.routine = 'pooler_error'
    error.detail = 'Key (bucket_id, name)=(public, secret.txt) already exists.'
    error.hint = 'try again later'

    const mapped = DBError.fromDBError(error, 'SELECT * FROM storage.objects')

    expect(mapped).toMatchObject({ code: 'DatabaseError', originalError: error })
    expect(mapped.metadata).toEqual({
      query: 'SELECT * FROM storage.objects',
      code: '08P01',
      pgMessage: 'no more connections allowed (max_client_conn)',
    })
  })

  test.each([
    '22P02',
    '22007',
    '22008',
  ])('maps invalid input error %s without including its pg message in metadata', (code) => {
    const error = createPgError(
      code,
      'invalid input syntax for type uuid: "attacker-controlled-value"'
    )
    error.severity = 'ERROR'
    error.detail = 'Value "attacker-controlled-value" is not a uuid.'
    error.hint = 'Check the id parameter.'

    const mapped = DBError.fromDBError(error, 'SELECT * FROM storage.objects')

    expect(mapped).toMatchObject({ code: 'InvalidParameter' })
    expect(mapped.metadata).toEqual({
      query: 'SELECT * FROM storage.objects',
      code,
    })
    expect(mapped.message).toContain('attacker-controlled-value')
  })

  test('does not include row values from duplicate-key details in metadata', () => {
    const error = createPgError('23505', 'duplicate key value violates unique constraint')
    error.severity = 'ERROR'
    error.detail = 'Key (bucket_id, name)=(public, secret.txt) already exists.'
    error.hint = 'try a different object name'

    const mapped = DBError.fromDBError(error, 'INSERT INTO storage.objects')

    expect(mapped).toMatchObject({ code: 'ResourceAlreadyExists' })
    expect(mapped.metadata).toEqual({
      query: 'INSERT INTO storage.objects',
      code: '23505',
    })
  })
})

function createPgError(code: string, message: string): DatabaseError {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}
