import type { FieldErrors } from 'react-hook-form'

export type FunnelOrigin = 'signup' | 'project_creation' | 'org_creation'
export type ErrorCategory = 'validation' | 'api' | 'network' | 'payment' | 'unknown'

export interface FunnelErrorClassification {
  errorCategory: ErrorCategory
  errorReason: FunnelErrorReason
  errorCode?: number
}

const RATE_LIMIT_STATUS = 429

const API_REASON_PATTERNS = {
  signup: [
    [/already registered|already been registered|already exists/i, 'email_already_registered'],
    [/rate limit|too many requests|after \d+ second/i, 'rate_limited'],
    [/captcha/i, 'captcha_failed'],
    [/password/i, 'password_rejected'],
    [/valid email|invalid email|email address/i, 'email_invalid'],
  ],
  project_creation: [
    [/already exists/i, 'project_name_taken'],
    [/free plan|free tier/i, 'free_tier_limit'],
    [/limit|maximum number|can only have/i, 'project_limit_reached'],
    [/payment|invoice|overdue|past due|billing/i, 'billing_issue'],
    [/region/i, 'region_unavailable'],
    [/db_pass|password/i, 'db_password_rejected'],
  ],
  org_creation: [
    [/already exists|name.*taken/i, 'org_name_taken'],
    [/payment|card|invoice|billing/i, 'billing_issue'],
    [/limit/i, 'org_limit_reached'],
  ],
} as const satisfies Record<FunnelOrigin, ReadonlyArray<readonly [RegExp, string]>>

const VALIDATION_FIELD_REASONS = {
  signup: {
    email: 'email_invalid',
    password: 'password_invalid',
  },
  project_creation: {
    organization: 'organization_missing',
    projectName: 'project_name_invalid',
    dbPass: 'db_password_weak',
    dbPassStrength: 'db_password_weak',
    dbRegion: 'region_missing',
    cloudProvider: 'cloud_provider_invalid',
    postgresVersion: 'postgres_version_missing',
    highAvailability: 'incompatible_options',
    useOrioleDb: 'incompatible_options',
  },
  org_creation: {
    name: 'org_name_missing',
    kind: 'org_kind_invalid',
    size: 'org_size_invalid',
  },
} as const satisfies Record<FunnelOrigin, Readonly<Record<string, string>>>

const STRIPE_DECLINE_REASONS = {
  insufficient_funds: 'card_insufficient_funds',
  card_declined: 'card_declined',
  expired_card: 'card_expired',
  incorrect_cvc: 'card_incorrect_cvc',
  incorrect_number: 'card_incorrect_number',
  processing_error: 'card_processing_error',
} as const satisfies Record<string, string>

const GENERIC_REASONS = [
  'rate_limited',
  'server_error',
  'connection_timeout',
  'network_error',
  'payment_failed',
  'payment_error',
  'oriole_unavailable',
  'unauthorized',
  'forbidden',
  'not_found',
  'other',
] as const

type ValuesOf<T> = T extends Readonly<Record<string, infer V extends string>> ? V : never

export type FunnelErrorReason =
  | (typeof API_REASON_PATTERNS)[FunnelOrigin][number][1]
  | ValuesOf<(typeof VALIDATION_FIELD_REASONS)[FunnelOrigin]>
  | ValuesOf<typeof STRIPE_DECLINE_REASONS>
  | (typeof GENERIC_REASONS)[number]

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
