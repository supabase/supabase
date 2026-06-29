import {
  API_REASON_PATTERNS,
  STRIPE_DECLINE_REASONS,
  VALIDATION_FIELD_REASONS,
  type FunnelErrorReason,
  type FunnelOrigin,
} from 'common/funnel-error-reasons'
import type { FieldErrors } from 'react-hook-form'

export type { FunnelErrorReason, FunnelOrigin }

export type ErrorCategory = 'validation' | 'api' | 'network' | 'payment' | 'unknown'

export interface FunnelErrorClassification {
  errorCategory: ErrorCategory
  errorReason: FunnelErrorReason
  errorCode?: number
}

const RATE_LIMIT_STATUS = 429

const STATUS_REASONS: Readonly<Partial<Record<number, FunnelErrorReason>>> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
}

export function classifyApiError(origin: FunnelOrigin, error: unknown): FunnelErrorClassification {
  const err = error as { code?: unknown; errorType?: unknown; message?: unknown }
  const code = typeof err?.code === 'number' ? err.code : undefined
  const message = typeof err?.message === 'string' ? err.message : ''

  if (err?.errorType === 'connection-timeout') {
    return { errorCategory: 'network', errorReason: 'connection_timeout' }
  }
  if (code === undefined) {
    return { errorCategory: 'network', errorReason: 'network_error' }
  }
  if (code === RATE_LIMIT_STATUS) {
    return { errorCategory: 'api', errorReason: 'rate_limited', errorCode: code }
  }
  if (code >= 500) {
    return { errorCategory: 'api', errorReason: 'server_error', errorCode: code }
  }
  for (const [pattern, reason] of API_REASON_PATTERNS[origin]) {
    if (pattern.test(message)) {
      return { errorCategory: 'api', errorReason: reason, errorCode: code }
    }
  }
  const statusReason = STATUS_REASONS[code]
  if (statusReason) {
    return { errorCategory: 'api', errorReason: statusReason, errorCode: code }
  }
  return { errorCategory: 'api', errorReason: 'other', errorCode: code }
}

export function classifyValidationError(
  origin: FunnelOrigin,
  errors: FieldErrors
): FunnelErrorClassification {
  const fieldErrors = errors as Record<string, unknown>
  const reasons = VALIDATION_FIELD_REASONS[origin] as Readonly<Record<string, FunnelErrorReason>>
  for (const field of Object.keys(reasons)) {
    if (fieldErrors[field]) {
      return { errorCategory: 'validation', errorReason: reasons[field] }
    }
  }
  return { errorCategory: 'validation', errorReason: 'other' }
}

export function classifyStripeError(error: unknown): FunnelErrorClassification {
  const err = error as { code?: unknown; decline_code?: unknown }
  const key =
    typeof err?.decline_code === 'string'
      ? err.decline_code
      : typeof err?.code === 'string'
        ? err.code
        : undefined
  const reason = key
    ? (STRIPE_DECLINE_REASONS as Readonly<Record<string, FunnelErrorReason>>)[key]
    : undefined
  if (reason) {
    return { errorCategory: 'payment', errorReason: reason }
  }
  return { errorCategory: 'payment', errorReason: 'payment_failed' }
}
