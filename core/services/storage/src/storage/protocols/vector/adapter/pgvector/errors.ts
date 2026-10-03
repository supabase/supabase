import { ERRORS } from '@internal/errors'
import { DatabaseError } from 'pg'

interface PgErrorLike {
  code?: string
  message?: string
}

function isPgError(e: unknown): e is PgErrorLike {
  return (
    e instanceof DatabaseError ||
    (e !== null && typeof e === 'object' && typeof (e as PgErrorLike).code === 'string')
  )
}

export async function handlePgVectorError<T>(
  fn: () => Promise<T>,
  resource: { type: string; name: string }
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (!isPgError(e)) {
      throw e
    }

    // Postgres SQLSTATE classes:
    //   42P01  undefined_table  → index/bucket missing
    //   42P07  duplicate_table  → CREATE TABLE on already-existing index
    //   23505  unique_violation → key collision (we use upsert, but defensively map)
    //   21000  cardinality_violation → duplicate source keys in an upsert batch
    //   22P02  invalid_text_representation → e.g. dimension mismatch on vector cast
    //   22023  invalid_parameter_value → pgvector dimension mismatch
    switch (e.code) {
      case '42P01':
        throw ERRORS.S3VectorNotFoundException(resource.type, resource.name)
      case '42P07':
      case '23505':
        throw ERRORS.S3VectorConflictException(resource.type, resource.name)
      case '21000':
        throw ERRORS.InvalidParameter(resource.name, {
          message: e.message ?? 'duplicate keys in pgvector upsert batch',
        })
      case '22P02':
      case '22023':
        throw ERRORS.InvalidParameter(resource.name, {
          message: e.message ?? 'invalid value for pgvector operation',
        })
      default:
        throw e
    }
  }
}
