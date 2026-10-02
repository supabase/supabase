import { IcebergError } from '@storage/protocols/iceberg/catalog/errors'
import { DatabaseError } from 'pg'
import { configure } from 'safe-stable-stringify'
import { isS3Error, StorageBackendError } from './storage-error'

export enum ErrorCode {
  NoSuchBucket = 'NoSuchBucket',
  NoSuchLifecycleConfiguration = 'NoSuchLifecycleConfiguration',
  NoSuchKey = 'NoSuchKey',
  NoSuchUpload = 'NoSuchUpload',
  InvalidJWT = 'InvalidJWT',
  InvalidRequest = 'InvalidRequest',
  InvalidArgument = 'InvalidArgument',
  MalformedXML = 'MalformedXML',
  TenantNotFound = 'TenantNotFound',
  EntityTooLarge = 'EntityTooLarge',
  EntityTooSmall = 'EntityTooSmall',
  InternalError = 'InternalError',
  ResourceAlreadyExists = 'ResourceAlreadyExists',
  ResourceNotEmpty = 'ResourceNotEmpty',
  S3BucketNotEmpty = 'BucketNotEmpty',
  InvalidBucketName = 'InvalidBucketName',
  InvalidKey = 'InvalidKey',
  InvalidRange = 'InvalidRange',
  InvalidMimeType = 'InvalidMimeType',
  InvalidUploadId = 'InvalidUploadId',
  KeyAlreadyExists = 'KeyAlreadyExists',
  BucketAlreadyExists = 'BucketAlreadyExists',
  DatabaseTimeout = 'DatabaseTimeout',
  DatabaseReadOnly = 'DatabaseReadOnly',
  DatabaseTransactionAborted = 'DatabaseTransactionAborted',
  DatabaseInvalidObjectDefinition = 'DatabaseInvalidObjectDefinition',
  DatabaseSchemaMismatch = 'DatabaseSchemaMismatch',
  InvalidSignature = 'InvalidSignature',
  ExpiredToken = 'ExpiredToken',
  SignatureDoesNotMatch = 'SignatureDoesNotMatch',
  AccessDenied = 'AccessDenied',
  ResourceLocked = 'ResourceLocked',
  ResourceReferenced = 'ResourceReferenced',
  DatabaseError = 'DatabaseError',
  TransactionError = 'TransactionError',
  MissingContentLength = 'MissingContentLength',
  MissingParameter = 'MissingParameter',
  InvalidParameter = 'InvalidParameter',
  InvalidUploadSignature = 'InvalidUploadSignature',
  LockTimeout = 'LockTimeout',
  S3Error = 'S3Error',
  PreconditionFailed = 'PreconditionFailed',
  S3InvalidAccessKeyId = 'InvalidAccessKeyId',
  S3MaximumCredentialsLimit = 'MaximumCredentialsLimit',
  InvalidChecksum = 'InvalidChecksum',
  MissingPart = 'MissingPart',
  InvalidPartOrder = 'InvalidPartOrder',
  SlowDown = 'SlowDown',
  TusError = 'TusError',
  Aborted = 'Aborted',
  AbortedTerminate = 'AbortedTerminate',
  FeatureNotEnabled = 'FeatureNotEnabled',
  NotSupported = 'NotSupported',
  IcebergMaximumResourceLimit = 'IcebergMaximumResourceLimit',
  IcebergResourceNotEmpty = 'IcebergResourceNotEmpty',
  NoSuchCatalog = 'NoSuchCatalog',
  UnknownError = 'UnknownError',
  S3VectorConflictException = 'ConflictException',
  S3VectorNotFoundException = 'NotFoundException',
  S3VectorBucketNotEmpty = 'VectorBucketNotEmpty',
  S3VectorMaxBucketsExceeded = 'S3VectorMaxBucketsExceeded',
  S3VectorMaxIndexesExceeded = 'S3VectorMaxIndexesExceeded',
  NoAvailableShard = 'NoAvailableShard',
  ShardNotFound = 'ShardNotFound',
}
const KNOWN_ERROR_CODES = new Set<string>(Object.values(ErrorCode))

export const ERRORS = {
  BucketNotEmpty: (bucket: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.ResourceNotEmpty,
      resource: bucket,
      httpStatusCode: 409,
      message: `The bucket you tried to delete is not empty`,
      originalError: e,
    }),
  S3BucketNotEmpty: (bucket: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.S3BucketNotEmpty,
      resource: bucket,
      httpStatusCode: 409,
      message: `The bucket you tried to delete is not empty`,
      originalError: e,
    }),
  IcebergMaximumResourceLimit: (resource: string, limit: number, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.IcebergMaximumResourceLimit,
      httpStatusCode: 409,
      message: `The maximum number of this resource (${resource}) ${limit} is reached`,
      originalError: e,
    }),
  IcebergResourceNotEmpty: (resource: string, name: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.IcebergResourceNotEmpty,
      httpStatusCode: 400,
      message: `The resource ${resource}: ${name} is not empty`,
      originalError: e,
    }),
  FeatureNotEnabled: (resource: string, feature: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.FeatureNotEnabled,
      resource,
      httpStatusCode: 409,
      message: `The feature ${feature} is not enabled for this resource`,
      originalError: e,
    }),
  NotSupported: (feature: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.NotSupported,
      httpStatusCode: 409,
      message: `The feature ${feature} is not enabled for this resource`,
      originalError: e,
    }),
  LifecycleRequiresStandardBucket: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: 'Versioning and lifecycle are only supported for Standard buckets',
      originalError: e,
    }),
  UnableToEmptyBucket: (bucket: string, msg: string) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      resource: bucket,
      httpStatusCode: 409,
      message: msg,
    }),
  NoSuchBucket: (bucket: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.NoSuchBucket,
      resource: bucket,
      error: 'Bucket not found',
      httpStatusCode: 404,
      message: `Bucket not found`,
      originalError: e,
    }),
  NoSuchLifecycleConfiguration: (bucket: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.NoSuchLifecycleConfiguration,
      resource: bucket,
      httpStatusCode: 404,
      message: 'The lifecycle configuration does not exist',
      originalError: e,
    }),
  NoSuchUpload: (uploadId: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.NoSuchUpload,
      resource: uploadId,
      httpStatusCode: 404,
      message: `Upload not found`,
      originalError: e,
    }),
  NoSuchKey: (resource: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.NoSuchKey,
      resource,
      error: 'not_found',
      httpStatusCode: 404,
      message: `Object not found`,
      originalError: e,
    }),

  MissingParameter: (parameter: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.MissingParameter,
      httpStatusCode: 400,
      message: `Missing Required Parameter ${parameter}`,
      originalError: e,
    }),

  InvalidParameter: (parameter: string, opts?: { error?: Error; message?: string }) =>
    new StorageBackendError({
      code: ErrorCode.InvalidParameter,
      httpStatusCode: 400,
      message: opts?.message || `Invalid Parameter ${parameter}`,
      originalError: opts?.error,
    }),

  InvalidRequest: (message: string, error?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: message || 'Invalid Request',
      originalError: error,
    }),

  InvalidArgument: (message: string, error?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidArgument,
      httpStatusCode: 400,
      message,
      originalError: error,
    }),

  MalformedXML: (message: string, error?: Error) =>
    new StorageBackendError({
      code: ErrorCode.MalformedXML,
      httpStatusCode: 400,
      message,
      originalError: error,
    }),

  InvalidJWT: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidJWT,
      httpStatusCode: 400,
      message: e?.message || 'Invalid JWT',
    }),

  MissingContentLength: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.MissingContentLength,
      httpStatusCode: 400,
      message: e?.message || 'You must provide the Content-Length HTTP header.',
    }),

  AccessDenied: (action: string, e?: Error) =>
    new StorageBackendError({
      error: 'Unauthorized',
      code: ErrorCode.AccessDenied,
      httpStatusCode: 403,
      message: action || 'Access denied',
      originalError: e,
    }),

  ResourceAlreadyExists: (e?: Error) =>
    new StorageBackendError({
      error: 'Duplicate',
      code: ErrorCode.ResourceAlreadyExists,
      httpStatusCode: 409,
      message: 'The resource already exists',
      originalError: e,
    }),

  MetadataRequired: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: 'Metadata header is required',
      originalError: e,
    }),

  SignatureDoesNotMatch: (message?: string) =>
    new StorageBackendError({
      code: ErrorCode.SignatureDoesNotMatch,
      httpStatusCode: 403,
      message: message || 'Signature does not match',
    }),

  InvalidSignature: (message?: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidSignature,
      httpStatusCode: 400,
      message: message || 'Invalid signature',
      originalError: e,
    }),

  ExpiredSignature: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.ExpiredToken,
      httpStatusCode: 400,
      message: 'The provided token has expired.',
      originalError: e,
    }),

  InvalidXForwardedHeader: (message?: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: message || 'Invalid X-Forwarded-Host header',
      originalError: e,
    }),

  InvalidTenantId: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.TenantNotFound,
      httpStatusCode: 400,
      message: e?.message || 'Invalid tenant id',
      originalError: e,
    }),

  InvalidUploadId: (message?: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidUploadId,
      httpStatusCode: 400,
      message: message || 'Invalid upload id',
      originalError: e,
    }),

  TusError: (message: string, statusCode: number) =>
    new StorageBackendError({
      code: ErrorCode.TusError,
      httpStatusCode: statusCode,
      message,
    }),

  MissingTenantConfig: (tenantId: string) =>
    new StorageBackendError({
      code: ErrorCode.TenantNotFound,
      httpStatusCode: 400,
      message: `Missing tenant config for tenant ${tenantId}`,
    }),

  InvalidMimeType: (mimeType: string) =>
    new StorageBackendError({
      error: 'invalid_mime_type',
      code: ErrorCode.InvalidMimeType,
      httpStatusCode: 415,
      message: `mime type ${mimeType} is not supported`,
    }),

  InvalidXRobotsTag: (message: string) =>
    new StorageBackendError({
      error: 'invalid_x_robots_tag',
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: `Invalid X-Robots-Tag header: ${message}`,
    }),

  InvalidHeaderChar: (headerName: string, headerValue: string) =>
    new StorageBackendError({
      error: 'invalid_header_char',
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: `Invalid character in response header "${headerName}": ${headerValue.substring(0, 50)}`,
    }),

  InvalidRange: () =>
    new StorageBackendError({
      error: 'invalid_range',
      code: ErrorCode.InvalidRange,
      httpStatusCode: 400,
      message: `invalid range provided`,
    }),

  EntityTooLarge: (e?: Error, entity = 'object', limit = 'the maximum allowed size') =>
    new StorageBackendError({
      error: 'Payload too large',
      code: ErrorCode.EntityTooLarge,
      httpStatusCode: 413,
      message: `The ${entity} exceeded ${limit}`,
      originalError: e,
    }),

  EntityTooSmall: (entity = 'object', limit = 'the minimum allowed size') =>
    new StorageBackendError({
      error: 'Payload too small',
      code: ErrorCode.EntityTooSmall,
      httpStatusCode: 400,
      message: `The ${entity} is smaller than ${limit}`,
    }),

  InternalError: (e?: Error, message?: string) =>
    new StorageBackendError({
      code: ErrorCode.InternalError,
      httpStatusCode: 500,
      message: message || 'Internal server error',
      originalError: e,
    }),

  ImageProcessingError: (statusCode: number, message: string, e?: Error) =>
    new StorageBackendError({
      code: statusCode > 499 ? ErrorCode.InternalError : ErrorCode.InvalidRequest,
      httpStatusCode: statusCode,
      message,
      originalError: e,
    }),

  InvalidBucketName: (bucket: string, e?: Error) =>
    new StorageBackendError({
      error: 'Invalid Input',
      code: ErrorCode.InvalidBucketName,
      resource: bucket,
      httpStatusCode: 400,
      message: `Bucket name invalid`,
      originalError: e,
    }),

  InvalidFileSizeLimit: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: e?.message || 'Invalid file size format, hint: use 20GB / 20MB / 30KB / 3B',
      originalError: e,
    }),

  InvalidUploadSignature: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidUploadSignature,
      httpStatusCode: 400,
      message: e?.message || 'Invalid upload Signature',
      originalError: e,
    }),

  InvalidKey: (key: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidKey,
      resource: key,
      httpStatusCode: 400,
      message: `Invalid key: ${key}`,
      originalError: e,
    }),

  KeyAlreadyExists: (key: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.KeyAlreadyExists,
      resource: key,
      error: 'Duplicate',
      httpStatusCode: 409,
      message: `The resource already exists`,
      originalError: e,
    }),

  BucketAlreadyExists: (bucket: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.BucketAlreadyExists,
      resource: bucket,
      error: 'Duplicate',
      httpStatusCode: 409,
      message: `The resource already exists`,
      originalError: e,
    }),

  NoContentProvided: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 400,
      message: e?.message || 'No content provided',
      originalError: e,
    }),

  DatabaseTimeout: (e?: Error) =>
    StorageBackendError.withStatusCode(544, {
      code: ErrorCode.DatabaseTimeout,
      httpStatusCode: 544,
      message: 'The connection to the database timed out',
      originalError: e,
    }),

  DatabaseReadOnly: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.DatabaseReadOnly,
      httpStatusCode: 503,
      message: 'The database is currently in read-only mode. Please try again later.',
      originalError: e,
    }),

  DatabaseTransactionAborted: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.DatabaseTransactionAborted,
      httpStatusCode: 500,
      message:
        'The database transaction has been aborted. Roll back the transaction before retrying.',
      originalError: e,
    }),

  InvalidObjectDefinition: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.DatabaseInvalidObjectDefinition,
      httpStatusCode: 503,
      message: 'The database schema is invalid or incompatible.',
      originalError: e,
    }),

  DatabaseSchemaMismatch: (e: DatabaseError) =>
    e.internalQuery && e.internalPosition // originates in trigger or RLS
      ? new StorageBackendError({
          code: ErrorCode.DatabaseSchemaMismatch,
          httpStatusCode: 503,
          message: 'There is a database schema mismatch in a trigger or RLS policy: ' + e.where,
          originalError: e,
        })
      : new StorageBackendError({
          code: ErrorCode.DatabaseSchemaMismatch,
          httpStatusCode: 503,
          message: 'The database schema is out of sync. Please run migrations or contact support.',
          originalError: e,
        }),

  ResourceLocked: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.ResourceLocked,
      httpStatusCode: 423,
      message: `The resource is locked`,
      originalError: e,
    }),

  ResourceReferenced: (message: string, e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.ResourceReferenced,
      httpStatusCode: 409,
      message,
      originalError: e,
    }),

  RelatedResourceNotFound: (e?: Error) =>
    new StorageBackendError({
      code: ErrorCode.InvalidRequest,
      httpStatusCode: 404,
      message: `The related resource does not exist`,
      originalError: e,
    }),

  TransactionError: (message: string, err?: Error) =>
    new StorageBackendError({
      code: ErrorCode.TransactionError,
      httpStatusCode: 409,
      message,
      originalError: err,
    }),

  DatabaseError: (message: string, err?: Error) =>
    new StorageBackendError({
      code: ErrorCode.DatabaseError,
      httpStatusCode: 500,
      message,
      originalError: err,
    }),

  LockTimeout: (err?: Error) =>
    new StorageBackendError({
      error: 'acquiring_lock_timeout',
      code: ErrorCode.LockTimeout,
      httpStatusCode: 503,
      message: 'acquiring lock timeout',
      originalError: err,
    }),

  MissingS3Credentials: () =>
    new StorageBackendError({
      code: ErrorCode.S3InvalidAccessKeyId,
      httpStatusCode: 403,
      message: 'The Access Key Id you provided does not exist in our records.',
    }),

  MaximumCredentialsLimit: () =>
    new StorageBackendError({
      code: ErrorCode.S3MaximumCredentialsLimit,
      httpStatusCode: 400,
      message: 'You have reached the maximum number of credentials allowed',
    }),

  InvalidChecksum: (message: string) =>
    new StorageBackendError({
      code: ErrorCode.InvalidChecksum,
      httpStatusCode: 400,
      message,
    }),

  MissingPart: (partNumber: number, uploadId: string) =>
    new StorageBackendError({
      code: ErrorCode.MissingPart,
      httpStatusCode: 400,
      message: `Part ${partNumber} is missing for upload id ${uploadId}`,
    }),

  InvalidPartOrder: () =>
    new StorageBackendError({
      code: ErrorCode.InvalidPartOrder,
      httpStatusCode: 400,
      message:
        'The list of parts was not in ascending order. Parts must be ordered by part number.',
    }),

  Aborted: (message: string, originalError?: unknown) =>
    new StorageBackendError({
      code: ErrorCode.Aborted,
      httpStatusCode: 500,
      message,
      originalError,
    }),
  AbortedTerminate: (message: string, originalError?: unknown) =>
    new StorageBackendError({
      code: ErrorCode.AbortedTerminate,
      httpStatusCode: 500,
      message,
      originalError,
    }).withConnectionClose(),
  NoSuchCatalog: (name: string) => {
    return new StorageBackendError({
      code: ErrorCode.NoSuchCatalog,
      httpStatusCode: 404,
      message: `Catalog name "${name}" not found`,
    })
  },
  S3VectorConflictException(resource: string, name: string) {
    return new StorageBackendError({
      code: ErrorCode.S3VectorConflictException,
      httpStatusCode: 409,
      message: `${resource} "${name}" already exists`,
    })
  },
  S3VectorNotFoundException(resource: string, name: string) {
    return new StorageBackendError({
      code: ErrorCode.S3VectorNotFoundException,
      httpStatusCode: 404,
      message: `resource "${name}" not found`,
    })
  },
  S3VectorBucketNotEmpty(name: string) {
    return new StorageBackendError({
      code: ErrorCode.S3VectorBucketNotEmpty,
      httpStatusCode: 400,
      message: `Vector Bucket "${name}" not empty`,
    })
  },
  S3VectorMaxBucketsExceeded(maxBuckets: number) {
    return new StorageBackendError({
      code: ErrorCode.S3VectorMaxBucketsExceeded,
      httpStatusCode: 400,
      message: `Maximum number of buckets exceeded. Max allowed is ${maxBuckets}. Contact support to increase your limit.`,
    })
  },
  S3VectorMaxIndexesExceeded(maxIndexes: number) {
    return new StorageBackendError({
      code: ErrorCode.S3VectorMaxIndexesExceeded,
      httpStatusCode: 400,
      message: `Maximum number of indexes exceeded. Max allowed is ${maxIndexes}. Contact support to increase your limit.`,
    })
  },
  NoAvailableShard() {
    return new StorageBackendError({
      code: ErrorCode.NoAvailableShard,
      httpStatusCode: 500,
      message: `No available shards are available to host the resource. Please try again later.`,
    })
  },
  ShardNotFound(shardId: string) {
    return new StorageBackendError({
      code: ErrorCode.ShardNotFound,
      httpStatusCode: 404,
      message: `Shard not found: ${shardId}`,
    })
  },
}

const ERROR_CODE_MAP: Record<string, ErrorCode> = {
  FST_ERR_VALIDATION: ErrorCode.InvalidRequest,
  FST_ERR_CTP_EMPTY_JSON_BODY: ErrorCode.InvalidRequest,
  FST_ERR_CTP_INVALID_JSON_BODY: ErrorCode.InvalidRequest,
  FST_ERR_CTP_INVALID_CONTENT_LENGTH: ErrorCode.InvalidRequest,
  FST_ERR_CTP_INVALID_MEDIA_TYPE: ErrorCode.InvalidMimeType,
  FST_ERR_CTP_BODY_TOO_LARGE: ErrorCode.EntityTooLarge,
}
const ERROR_RAW_OMITTED_KEYS = new Set(['client'])

export function isStorageError(errorType: ErrorCode, error: unknown): error is StorageBackendError {
  return error instanceof StorageBackendError && error.code === errorType
}

function hasNumericStatusCode(error: Error): error is Error & { statusCode: number } {
  return 'statusCode' in error && typeof error.statusCode === 'number'
}

function hasStringErrorCode(error: Error): error is Error & { code: string } {
  return 'code' in error && typeof error.code === 'string'
}

export function getErrorCode(error: Error): string {
  if (isS3Error(error)) {
    return ErrorCode.S3Error
  }
  if (error instanceof IcebergError && error.error) {
    return error.error
  }
  if (hasStringErrorCode(error)) {
    if (KNOWN_ERROR_CODES.has(error.code)) {
      return error.code as ErrorCode
    }
    if (error.code in ERROR_CODE_MAP) {
      return ERROR_CODE_MAP[error.code]
    }
  }
  return ErrorCode.UnknownError
}

function getErrorStatusCode(error: Error): number {
  if (isS3Error(error) && error.$metadata.httpStatusCode) {
    return error.$metadata.httpStatusCode
  }
  if (error instanceof StorageBackendError && error.httpStatusCode) {
    return error.httpStatusCode
  }
  if (error instanceof IcebergError) {
    return error.code
  }
  if (hasNumericStatusCode(error)) {
    // Fastify validation errors include statusCode we can use
    return error.statusCode
  }
  return 0
}

export function normalizeRawError(error: unknown, logLevel: string) {
  if (error instanceof Error) {
    const statusCode = getErrorStatusCode(error)
    const errorCode = getErrorCode(error)
    const includeStack =
      logLevel === 'debug' || statusCode >= 500 || errorCode === ErrorCode.UnknownError

    return {
      raw: stringifyErrorRaw(error, includeStack),
      name: error.name,
      message: error.message,
      stack: includeStack ? error.stack || '' : '',
      statusCode,
      errorCode,
    }
  }

  try {
    return {
      raw: JSON.stringify(error),
    }
  } catch {
    return {
      raw: 'Failed to stringify error',
    }
  }
}

const stableStringify = configure({
  maximumDepth: 8,
  maximumBreadth: 64,
  deterministic: false,
})

function createErrorRawReplacer(includeStack: boolean) {
  return function errorRawReplacer(key: string, value: unknown) {
    if (ERROR_RAW_OMITTED_KEYS.has(key)) {
      return undefined
    }

    // `message`/`stack`/`cause` are non-enumerable on Error instances
    // so a nested error (e.g. `originalError`, or a `cause` chain from `fetch`/undici)
    // would otherwise stringify to `{}` and silently drop the data needed to debug
    // The root error is skipped. Its message/stack are already captured as separate top-level fields by normalizeRawError.
    if (key !== '' && value instanceof Error) {
      return {
        ...value,
        name: value.name,
        message: value.message,
        stack: includeStack ? value.stack : undefined,
        cause: value.cause,
        errors: value instanceof AggregateError ? value.errors : undefined,
      }
    }

    return value
  }
}

function stringifyErrorRaw(error: Error, includeStack: boolean): string {
  try {
    return (
      stableStringify(error, createErrorRawReplacer(includeStack)) ?? 'Failed to stringify error'
    )
  } catch {
    return 'Failed to stringify error'
  }
}
