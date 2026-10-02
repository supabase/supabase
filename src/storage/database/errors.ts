import { ERRORS, RenderableError, StorageBackendError, StorageErrorOptions } from '@internal/errors'
import { hasDatabaseSlowDownMessage } from '@internal/errors/database-error'
import { DatabaseError } from 'pg'

export interface PgErrorContext {
  query?: string
  queryName?: string
}

export class DBError extends StorageBackendError implements RenderableError {
  constructor(options: StorageErrorOptions) {
    super(options)
    Object.setPrototypeOf(this, DBError.prototype)
  }

  static fromDBError(pgError: DatabaseError, context?: string | PgErrorContext) {
    switch (pgError.code) {
      case '42501':
        return ERRORS.AccessDenied(
          pgError.message.includes('row-level security')
            ? 'new row violates row-level security policy'
            : pgError.message,
          pgError
        ).withMetadata(pgErrorMetadata(pgError, context))
      case '23505':
        return ERRORS.ResourceAlreadyExists(pgError).withMetadata(pgErrorMetadata(pgError, context))
      case '23503':
        if (pgError.detail?.includes('is still referenced from table')) {
          const isOrphanMultipart =
            pgError.constraint === 's3_multipart_uploads_bucket_id_fkey' ||
            pgError.constraint === 's3_multipart_uploads_parts_bucket_id_fkey'

          const message = isOrphanMultipart
            ? 'The bucket could not be updated because it is referenced by a pending multipart upload.'
            : 'The resource could not be updated or removed due to a foreign key constraint'

          return ERRORS.ResourceReferenced(message, pgError).withMetadata(
            pgErrorMetadata(pgError, context)
          )
        }
        return ERRORS.RelatedResourceNotFound(pgError).withMetadata(
          pgErrorMetadata(pgError, context)
        )
      case '55P03':
      case 'resource_locked':
        return ERRORS.ResourceLocked(pgError).withMetadata(pgErrorMetadata(pgError, context))
      case '57014':
        return ERRORS.DatabaseTimeout(pgError).withMetadata(pgErrorMetadata(pgError, context))
      case '25006':
        return ERRORS.DatabaseReadOnly(pgError).withMetadata(pgErrorMetadata(pgError, context))
      case '25P02':
        return ERRORS.DatabaseTransactionAborted(pgError).withMetadata(
          pgErrorMetadata(pgError, context)
        )
      case '42P17':
        return ERRORS.InvalidObjectDefinition(pgError).withMetadata(
          pgErrorMetadata(pgError, context)
        )
      case '22P02':
      case '22007':
      case '22008':
        return ERRORS.InvalidParameter('value', {
          error: pgError,
          message: pgError.message || 'Invalid value format or type conversion failed',
        }).withMetadata(pgErrorMetadata(pgError, context))
      case '42703':
      case '42P01':
        return ERRORS.DatabaseSchemaMismatch(pgError).withMetadata(
          pgErrorMetadata(pgError, context)
        )
      default:
        return ERRORS.DatabaseError(`database error, code: ${pgError.code}`, pgError).withMetadata(
          pgErrorMetadata(pgError, context)
        )
    }
  }
}

export function mapPgTransactionAbortedError(error: unknown, query?: string): unknown {
  if (isPgTransactionAbortedError(error)) {
    return ERRORS.DatabaseTransactionAborted(error).withMetadata(pgErrorMetadata(error, query))
  }

  return error
}

function isPgTransactionAbortedError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError && error.code === '25P02'
}

function pgErrorMetadata(
  pgError: DatabaseError,
  context?: string | PgErrorContext
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {}

  if (typeof context === 'string') {
    setIfPresent(metadata, 'query', context)
  } else if (context) {
    setIfPresent(metadata, 'query', context.query)
    setIfPresent(metadata, 'queryName', context.queryName)
  }

  setIfPresent(metadata, 'code', pgError.code)
  if (shouldIncludePgMessage(pgError)) {
    setIfPresent(metadata, 'pgMessage', pgError.message)
  }

  return metadata
}

function shouldIncludePgMessage(pgError: DatabaseError): boolean {
  return Boolean(pgError.code?.startsWith('08') || hasDatabaseSlowDownMessage(pgError.message))
}

function setIfPresent(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined && value !== '') {
    target[key] = value
  }
}
