/**
 * Iceberg REST Catalog API Error Types
 * Based on Apache Iceberg REST Catalog specification (iceberg.spec.yaml)
 */

/**
 * Error model matching the Iceberg spec
 * Properties: message, type, code, stack (optional)
 */
export interface IcebergErrorModel {
  message: string
  type: IcebergErrorType
  code: number
  stack?: string[]
}

/**
 * All possible Iceberg error types as defined in the spec
 */
export enum IcebergErrorType {
  // Client Errors (4xx)
  BadRequestException = 'BadRequestException',
  NotAuthorizedException = 'NotAuthorizedException',
  UnsupportedOperationException = 'UnsupportedOperationException',
  NoSuchNamespaceException = 'NoSuchNamespaceException',
  NoSuchTableException = 'NoSuchTableException',
  NoSuchViewException = 'NoSuchViewException',
  NoSuchPlanIdException = 'NoSuchPlanIdException',
  NoSuchPlanTaskException = 'NoSuchPlanTaskException',
  AlreadyExistsException = 'AlreadyExistsException',
  NamespaceNotEmptyException = 'NamespaceNotEmptyException',
  UnprocessableEntityException = 'UnprocessableEntityException',
  AuthenticationTimeoutException = 'AuthenticationTimeoutException',
  // Server Errors (5xx)
  SlowDownException = 'SlowDownException',
  InternalServerError = 'InternalServerError',
}

/**
 * HTTP status codes used in Iceberg REST API errors
 */
export enum IcebergHttpStatusCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  NotAcceptable = 406,
  Conflict = 409,
  UnprocessableEntity = 422,
  AuthenticationTimeout = 419,
  ServiceUnavailable = 503,
  InternalServerError = 500,
}

/**
 * Iceberg REST Catalog API Error class
 * Implements RenderableError interface for proper error handling in the application
 */
export class IcebergError extends Error {
  readonly type: IcebergErrorType
  readonly code: number
  readonly userStatusCode: number
  readonly error?: string

  constructor(message: string, type: IcebergErrorType, code: number) {
    super(message)
    this.name = 'IcebergError'
    this.type = type
    this.code = code
    this.userStatusCode = code
    this.error = type
    Object.setPrototypeOf(this, IcebergError.prototype)
  }

  /**
   * Render error in the format expected by the storage API error handler
   * Matches the StorageError type
   */
  render() {
    return {
      statusCode: this.code.toString(),
      code: this.type,
      error: this.type,
      message: this.message,
    }
  }

  /**
   * Get the original error (if any)
   */
  getOriginalError(): unknown {
    return null
  }

  static fromResponse(data: unknown): IcebergError {
    if (!data || typeof data !== 'object') {
      return new IcebergError(
        'Unknown error',
        IcebergErrorType.InternalServerError,
        IcebergHttpStatusCode.InternalServerError
      )
    }

    const error = data as Record<string, unknown>
    const errorObj = error.error as Record<string, unknown> | undefined

    if (!errorObj) {
      return new IcebergError(
        'Unknown error',
        IcebergErrorType.InternalServerError,
        IcebergHttpStatusCode.InternalServerError
      )
    }

    const message = String(errorObj.message || 'Unknown error')
    const type = (errorObj.type as IcebergErrorType) || IcebergErrorType.InternalServerError
    const rawCode = errorObj.code
    const parsedCode =
      typeof rawCode === 'number'
        ? rawCode
        : typeof rawCode === 'string'
          ? Number(rawCode)
          : IcebergHttpStatusCode.InternalServerError
    const code =
      Number.isInteger(parsedCode) && parsedCode > 0
        ? parsedCode
        : IcebergHttpStatusCode.InternalServerError

    return new IcebergError(message, type, code)
  }
}

// Specific error factory functions

/**
 * Error: The request was malformed or invalid
 */
export function createBadRequestError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.BadRequestException,
    IcebergHttpStatusCode.BadRequest
  )
}

/**
 * Error: Authentication failed - token expired, revoked, malformed, or invalid
 */
export function createUnauthorizedError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NotAuthorizedException,
    IcebergHttpStatusCode.Unauthorized
  )
}

/**
 * Error: Forbidden - authenticated user lacks necessary permissions
 */
export function createForbiddenError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NotAuthorizedException,
    IcebergHttpStatusCode.Forbidden
  )
}

/**
 * Error: Namespace does not exist
 */
export function createNoSuchNamespaceError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NoSuchNamespaceException,
    IcebergHttpStatusCode.NotFound
  )
}

/**
 * Error: Table does not exist
 */
export function createNoSuchTableError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NoSuchTableException,
    IcebergHttpStatusCode.NotFound
  )
}

/**
 * Error: View does not exist
 */
export function createNoSuchViewError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NoSuchViewException,
    IcebergHttpStatusCode.NotFound
  )
}

/**
 * Error: Plan ID does not exist
 */
export function createNoSuchPlanIdError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NoSuchPlanIdException,
    IcebergHttpStatusCode.NotFound
  )
}

/**
 * Error: Plan task does not exist
 */
export function createNoSuchPlanTaskError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NoSuchPlanTaskException,
    IcebergHttpStatusCode.NotFound
  )
}

/**
 * Error: Resource already exists
 */
export function createAlreadyExistsError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.AlreadyExistsException,
    IcebergHttpStatusCode.Conflict
  )
}

/**
 * Error: Namespace is not empty and cannot be deleted
 */
export function createNamespaceNotEmptyError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.NamespaceNotEmptyException,
    IcebergHttpStatusCode.Conflict
  )
}

/**
 * Error: Unprocessable entity - e.g., duplicate keys in request body
 */
export function createUnprocessableEntityError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.UnprocessableEntityException,
    IcebergHttpStatusCode.UnprocessableEntity
  )
}

/**
 * Error: Server does not support this operation
 */
export function createUnsupportedOperationError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.UnsupportedOperationException,
    IcebergHttpStatusCode.NotAcceptable
  )
}

/**
 * Error: Authentication token has timed out
 */
export function createAuthenticationTimeoutError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.AuthenticationTimeoutException,
    IcebergHttpStatusCode.AuthenticationTimeout
  )
}

/**
 * Error: Service is unavailable or overloaded
 */
export function createSlowDownError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.SlowDownException,
    IcebergHttpStatusCode.ServiceUnavailable
  )
}

/**
 * Error: Internal server error
 */
export function createInternalServerError(message: string): IcebergError {
  return new IcebergError(
    message,
    IcebergErrorType.InternalServerError,
    IcebergHttpStatusCode.InternalServerError
  )
}
