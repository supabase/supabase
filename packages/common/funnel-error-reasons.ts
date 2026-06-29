export type FunnelOrigin = 'signup' | 'project_creation' | 'org_creation'

export const API_REASON_PATTERNS = {
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

export const VALIDATION_FIELD_REASONS = {
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

export const STRIPE_DECLINE_REASONS = {
  insufficient_funds: 'card_insufficient_funds',
  card_declined: 'card_declined',
  expired_card: 'card_expired',
  incorrect_cvc: 'card_incorrect_cvc',
  incorrect_number: 'card_incorrect_number',
  processing_error: 'card_processing_error',
} as const satisfies Record<string, string>

export const GENERIC_REASONS = [
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
