export type ErrorCode =
  | 'unauthorized'
  | 'consent_required'
  | 'oauth_required'
  | 'oauth_expired'
  | 'not_found'
  | 'invalid_request'
  | 'rate_limited'
  | 'internal'
  | 'conflict'

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  extra?: Record<string, unknown>
): Response {
  return Response.json({ code, message, ...extra }, { status })
}

export class HttpError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly extra?: Record<string, unknown>

  constructor(status: number, code: ErrorCode, message: string, extra?: Record<string, unknown>) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.extra = extra
  }

  toResponse(): Response {
    return jsonError(this.status, this.code, this.message, this.extra)
  }
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return error.toResponse()
  }

  console.error(error)
  return jsonError(500, 'internal', 'Unable to complete the request. Try again.')
}
