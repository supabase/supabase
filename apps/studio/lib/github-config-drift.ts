export type GitHubConfigFieldStatus = 'unmanaged' | 'managed' | 'drifted'

export interface GitHubConfigFieldState {
  status: GitHubConfigFieldStatus
  configPath?: string
  githubValue?: unknown
}

export interface GitHubConfigDriftField {
  fieldName: string
  configPath: string
  dashboardValue: unknown
  githubValue: unknown
}

export interface GitHubConfigDriftSummary {
  managedCount: number
  driftedFields: GitHubConfigDriftField[]
}

interface AuthFieldStateOptions {
  fieldName: string
  dashboardValue: unknown
  githubConfig?: Record<string, unknown>
  isSecret?: boolean
}

const AUTH_FIELD_CONFIG_PATHS: Record<string, string> = {
  DISABLE_SIGNUP: 'auth.enable_signup',
  EXTERNAL_ANONYMOUS_USERS_ENABLED: 'auth.enable_anonymous_sign_ins',
  SECURITY_MANUAL_LINKING_ENABLED: 'auth.enable_manual_linking',
  SITE_URL: 'auth.site_url',
  URI_ALLOW_LIST: 'auth.additional_redirect_urls',
  EXTERNAL_EMAIL_ENABLED: 'auth.email.enable_signup',
  EXTERNAL_PHONE_ENABLED: 'auth.sms.enable_signup',
  MAILER_AUTOCONFIRM: 'auth.email.enable_confirmations',
  MAILER_SECURE_EMAIL_CHANGE_ENABLED: 'auth.email.double_confirm_changes',
  MAILER_OTP_LENGTH: 'auth.email.otp_length',
  MAILER_OTP_EXP: 'auth.email.otp_expiry',
  PASSWORD_MIN_LENGTH: 'auth.minimum_password_length',
  PASSWORD_REQUIRED_CHARACTERS: 'auth.password_requirements',
  SMS_PROVIDER: 'auth.sms.provider',
  SMS_AUTOCONFIRM: 'auth.sms.enable_confirmations',
  SMS_OTP_EXP: 'auth.sms.otp_expiry',
  SMS_OTP_LENGTH: 'auth.sms.otp_length',
  SMS_TEMPLATE: 'auth.sms.template',
  SMS_TWILIO_ACCOUNT_SID: 'auth.sms.twilio.account_sid',
  SMS_TWILIO_MESSAGE_SERVICE_SID: 'auth.sms.twilio.message_service_sid',
  SMS_TWILIO_CONTENT_SID: 'auth.sms.twilio.content_sid',
  SMS_TWILIO_VERIFY_ACCOUNT_SID: 'auth.sms.twilio_verify.account_sid',
  SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID: 'auth.sms.twilio_verify.message_service_sid',
  SMS_MESSAGEBIRD_ORIGINATOR: 'auth.sms.messagebird.originator',
  SMS_TEXTLOCAL_SENDER: 'auth.sms.textlocal.sender',
  SMS_VONAGE_FROM: 'auth.sms.vonage.from',
}

const EXTERNAL_FIELD_SUFFIXES: ReadonlyArray<[suffix: string, configKey: string]> = [
  ['SKIP_NONCE_CHECK', 'skip_nonce_check'],
  ['EMAIL_OPTIONAL', 'email_optional'],
  ['REDIRECT_URI', 'redirect_uri'],
  ['CLIENT_ID', 'client_id'],
  ['ENABLED', 'enabled'],
  ['URL', 'url'],
]

const SECRET_FIELD_PATTERN = /(?:SECRET|TOKEN|API_KEY|ACCESS_KEY)$/
const INVERSE_BOOLEAN_FIELDS = new Set([
  'DISABLE_SIGNUP',
  'MAILER_AUTOCONFIRM',
  'SMS_AUTOCONFIRM',
])

// These are hosted Auth defaults, expressed using the config.toml value shape.
// Only fields with an explicit default belong here: an unknown default must remain
// unmanaged rather than being incorrectly reported as missing from code config.
const AUTH_FIELD_HOSTED_DEFAULTS: Readonly<Record<string, unknown>> = {
  SITE_URL: 'http://localhost:3000',
  URI_ALLOW_LIST: [],
}

export function getAuthFieldConfigState({
  fieldName,
  dashboardValue,
  githubConfig,
  isSecret = false,
}: AuthFieldStateOptions): GitHubConfigFieldState {
  if (isSecret || SECRET_FIELD_PATTERN.test(fieldName)) return { status: 'unmanaged' }

  const configPath = getAuthFieldConfigPath(fieldName)
  if (!configPath || !githubConfig) return { status: 'unmanaged' }

  let githubValue = getConfigValue(githubConfig, configPath)
  if (githubValue === undefined) {
    const defaultValue = AUTH_FIELD_HOSTED_DEFAULTS[fieldName]
    const isCodeOwned = getConfigValue(githubConfig, 'config_source') === 'code'

    if (!isCodeOwned || defaultValue === undefined) return { status: 'unmanaged' }

    const normalizedDashboardValue = normalizeDashboardValue(fieldName, dashboardValue)
    const normalizedDefaultValue = normalizeGitHubValue(fieldName, defaultValue)
    if (valuesMatch(normalizedDashboardValue, normalizedDefaultValue)) {
      return { status: 'unmanaged' }
    }

    githubValue = defaultValue
  }

  const normalizedDashboardValue = normalizeDashboardValue(fieldName, dashboardValue)
  const normalizedGitHubValue = normalizeGitHubValue(fieldName, githubValue)
  return {
    status: valuesMatch(normalizedDashboardValue, normalizedGitHubValue) ? 'managed' : 'drifted',
    configPath,
    githubValue,
  }
}

export function getAuthConfigDriftSummary({
  dashboardConfig,
  githubConfig,
}: {
  dashboardConfig?: object
  githubConfig?: Record<string, unknown>
}): GitHubConfigDriftSummary {
  if (!dashboardConfig || !githubConfig) {
    return { managedCount: 0, driftedFields: [] }
  }

  let managedCount = 0
  const driftedFields: GitHubConfigDriftField[] = []

  for (const [fieldName, rawDashboardValue] of Object.entries(dashboardConfig)) {
    const dashboardValue = normalizeRawAuthConfigValue(fieldName, rawDashboardValue)
    const state = getAuthFieldConfigState({ fieldName, dashboardValue, githubConfig })

    if (state.status === 'managed') managedCount += 1
    if (state.status !== 'drifted' || !state.configPath) continue

    driftedFields.push({
      fieldName,
      configPath: state.configPath,
      dashboardValue,
      githubValue: state.githubValue,
    })
  }

  return { managedCount, driftedFields }
}

export function getAuthFieldConfigPath(fieldName: string): string | undefined {
  const staticPath = AUTH_FIELD_CONFIG_PATHS[fieldName]
  if (staticPath) return staticPath
  if (!fieldName.startsWith('EXTERNAL_')) return undefined

  const providerField = fieldName.slice('EXTERNAL_'.length)
  for (const [suffix, configKey] of EXTERNAL_FIELD_SUFFIXES) {
    const suffixWithSeparator = `_${suffix}`
    if (!providerField.endsWith(suffixWithSeparator)) continue

    const provider = providerField.slice(0, -suffixWithSeparator.length).toLowerCase()
    if (!provider) return undefined
    return `auth.external.${provider}.${configKey}`
  }

  return undefined
}

export function getConfigValue(config: Record<string, unknown>, configPath: string): unknown {
  let value: unknown = config

  for (const segment of configPath.split('.')) {
    if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, segment)) {
      return undefined
    }
    value = value[segment]
  }

  return value
}

export function formatConfigValue(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function normalizeDashboardValue(fieldName: string, value: unknown): unknown {
  if (fieldName === 'PASSWORD_REQUIRED_CHARACTERS' && value === 'NO_REQUIRED_CHARS') return ''
  if (fieldName === 'URI_ALLOW_LIST') return normalizeRedirectUrls(value)
  return value
}

function normalizeGitHubValue(fieldName: string, value: unknown): unknown {
  if (fieldName === 'URI_ALLOW_LIST') return normalizeRedirectUrls(value)
  return value
}

function normalizeRawAuthConfigValue(fieldName: string, value: unknown): unknown {
  // The dashboard form presents this backend field with inverse semantics.
  if (INVERSE_BOOLEAN_FIELDS.has(fieldName) && typeof value === 'boolean') return !value
  return value
}

function valuesMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function normalizeRedirectUrls(value: unknown): string[] {
  const urls = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []

  return Array.from(
    new Set(urls.filter((url): url is string => typeof url === 'string').map((url) => url.trim()))
  )
    .filter(Boolean)
    .sort()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
