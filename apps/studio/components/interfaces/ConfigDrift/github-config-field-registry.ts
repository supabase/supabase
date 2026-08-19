import { StorageSizeUnits } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import { convertToBytes } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'

export const CONFIG_SECTIONS = ['api', 'auth', 'database', 'pooler', 'realtime', 'storage'] as const
export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

export type ConfigDriftDashboardConfig = Partial<Record<ConfigSection, Record<string, unknown>>>

interface ConfigFieldDefinition {
  section: ConfigSection
  /** The field's name as it appears (dot-joined, if nested) in the dashboard config section. */
  dashboardFieldName: string
  settingHref: (projectRef: string) => string
  /** Value to compare against when the field is absent from a code-owned config.toml. */
  hostedDefault?: unknown
  normalizeDashboardValue?: (value: unknown) => unknown
  normalizeGithubValue?: (value: unknown) => unknown
}

export type ResolvedConfigFieldDefinition = ConfigFieldDefinition & { configPath: string }

const toAuthUrlConfigHref = (projectRef: string) => `/project/${projectRef}/auth/url-configuration`
const toAuthProvidersHref = (projectRef: string) => `/project/${projectRef}/auth/providers`
const toApiSettingsHref = (projectRef: string) => `/project/${projectRef}/settings/api`
const toStorageSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/storage/files/settings`

const invertBoolean = (value: unknown) => (typeof value === 'boolean' ? !value : value)

/**
 * Every trackable field across every section, keyed by its config.toml dotted path — the same
 * shape `getConfigValue`/`setConfigValue` address. `section` + `dashboardFieldName` record how that
 * path shows up on the dashboard side, so `getFieldDefinition` can resolve either direction.
 */
const CONFIG_FIELD_REGISTRY: Record<string, ConfigFieldDefinition> = {
  'auth.enable_signup': {
    section: 'auth',
    dashboardFieldName: 'DISABLE_SIGNUP',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  'auth.enable_anonymous_sign_ins': {
    section: 'auth',
    dashboardFieldName: 'EXTERNAL_ANONYMOUS_USERS_ENABLED',
    settingHref: toAuthProvidersHref,
  },
  'auth.enable_manual_linking': {
    section: 'auth',
    dashboardFieldName: 'SECURITY_MANUAL_LINKING_ENABLED',
    settingHref: toAuthProvidersHref,
  },
  'auth.site_url': {
    section: 'auth',
    dashboardFieldName: 'SITE_URL',
    settingHref: toAuthUrlConfigHref,
    hostedDefault: 'http://localhost:3000',
  },
  'auth.additional_redirect_urls': {
    section: 'auth',
    dashboardFieldName: 'URI_ALLOW_LIST',
    settingHref: toAuthUrlConfigHref,
    hostedDefault: [],
    normalizeDashboardValue: normalizeRedirectUrls,
    normalizeGithubValue: normalizeRedirectUrls,
  },
  'auth.email.enable_signup': {
    section: 'auth',
    dashboardFieldName: 'EXTERNAL_EMAIL_ENABLED',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.enable_signup': {
    section: 'auth',
    dashboardFieldName: 'EXTERNAL_PHONE_ENABLED',
    settingHref: toAuthProvidersHref,
  },
  'auth.email.enable_confirmations': {
    section: 'auth',
    dashboardFieldName: 'MAILER_AUTOCONFIRM',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  'auth.email.double_confirm_changes': {
    section: 'auth',
    dashboardFieldName: 'MAILER_SECURE_EMAIL_CHANGE_ENABLED',
    settingHref: toAuthProvidersHref,
  },
  'auth.email.otp_length': {
    section: 'auth',
    dashboardFieldName: 'MAILER_OTP_LENGTH',
    settingHref: toAuthProvidersHref,
  },
  'auth.email.otp_expiry': {
    section: 'auth',
    dashboardFieldName: 'MAILER_OTP_EXP',
    settingHref: toAuthProvidersHref,
  },
  'auth.minimum_password_length': {
    section: 'auth',
    dashboardFieldName: 'PASSWORD_MIN_LENGTH',
    settingHref: toAuthProvidersHref,
  },
  'auth.password_requirements': {
    section: 'auth',
    dashboardFieldName: 'PASSWORD_REQUIRED_CHARACTERS',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: (value) => (value === 'NO_REQUIRED_CHARS' ? '' : value),
  },
  'auth.sms.provider': {
    section: 'auth',
    dashboardFieldName: 'SMS_PROVIDER',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.enable_confirmations': {
    section: 'auth',
    dashboardFieldName: 'SMS_AUTOCONFIRM',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  'auth.sms.otp_expiry': {
    section: 'auth',
    dashboardFieldName: 'SMS_OTP_EXP',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.otp_length': {
    section: 'auth',
    dashboardFieldName: 'SMS_OTP_LENGTH',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.template': {
    section: 'auth',
    dashboardFieldName: 'SMS_TEMPLATE',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio.account_sid': {
    section: 'auth',
    dashboardFieldName: 'SMS_TWILIO_ACCOUNT_SID',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio.message_service_sid': {
    section: 'auth',
    dashboardFieldName: 'SMS_TWILIO_MESSAGE_SERVICE_SID',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio.content_sid': {
    section: 'auth',
    dashboardFieldName: 'SMS_TWILIO_CONTENT_SID',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio_verify.account_sid': {
    section: 'auth',
    dashboardFieldName: 'SMS_TWILIO_VERIFY_ACCOUNT_SID',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio_verify.message_service_sid': {
    section: 'auth',
    dashboardFieldName: 'SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.messagebird.originator': {
    section: 'auth',
    dashboardFieldName: 'SMS_MESSAGEBIRD_ORIGINATOR',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.textlocal.sender': {
    section: 'auth',
    dashboardFieldName: 'SMS_TEXTLOCAL_SENDER',
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.vonage.from': {
    section: 'auth',
    dashboardFieldName: 'SMS_VONAGE_FROM',
    settingHref: toAuthProvidersHref,
  },
  'api.max_rows': {
    section: 'api',
    dashboardFieldName: 'max_rows',
    settingHref: toApiSettingsHref,
  },
  'storage.file_size_limit': {
    section: 'storage',
    dashboardFieldName: 'file_size_limit',
    settingHref: toStorageSettingsHref,
    normalizeGithubValue: parseFileSizeToBytes,
  },
}

/** Reverse index — `${section}:${dashboardFieldName}` → configPath — built once from the registry above. */
const CONFIG_PATH_BY_SECTION_AND_FIELD = new Map<string, string>(
  Object.entries(CONFIG_FIELD_REGISTRY).map(([configPath, definition]) => [
    `${definition.section}:${definition.dashboardFieldName}`,
    configPath,
  ])
)

const EXTERNAL_FIELD_SUFFIXES: ReadonlyArray<[suffix: string, configKey: string]> = [
  ['SKIP_NONCE_CHECK', 'skip_nonce_check'],
  ['EMAIL_OPTIONAL', 'email_optional'],
  ['REDIRECT_URI', 'redirect_uri'],
  ['CLIENT_ID', 'client_id'],
  ['ENABLED', 'enabled'],
  ['URL', 'url'],
]

function getExternalAuthFieldDefinition(
  fieldName: string
): ResolvedConfigFieldDefinition | undefined {
  if (!fieldName.startsWith('EXTERNAL_')) return undefined

  const providerField = fieldName.slice('EXTERNAL_'.length)
  for (const [suffix, configKey] of EXTERNAL_FIELD_SUFFIXES) {
    const suffixWithSeparator = `_${suffix}`
    if (!providerField.endsWith(suffixWithSeparator)) continue

    const provider = providerField.slice(0, -suffixWithSeparator.length).toLowerCase()
    if (!provider) return undefined
    return {
      section: 'auth',
      dashboardFieldName: fieldName,
      configPath: `auth.external.${provider}.${configKey}`,
      settingHref: toAuthProvidersHref,
    }
  }

  return undefined
}

/**
 * config.toml paths whose values are secrets — never tracked, compared, or displayed.
 * A `*` segment matches any key at that position (e.g. every vault entry, every OAuth provider).
 */
const SECRET_CONFIG_FIELDS = [
  'studio.openai_api_key',
  'db.root_key',
  'db.vault.*',
  'auth.publishable_key',
  'auth.secret_key',
  'auth.jwt_secret',
  'auth.email.smtp.pass',
  'auth.captcha.secret',
  'auth.hook.mfa_verification_attempt.secrets',
  'auth.hook.password_verification_attempt.secrets',
  'auth.hook.custom_access_token.secrets',
  'auth.hook.send_sms.secrets',
  'auth.hook.send_email.secrets',
  'auth.hook.before_user_created.secrets',
  'auth.sms.twilio.auth_token',
  'auth.sms.twilio_verify.auth_token',
  'auth.sms.messagebird.access_key',
  'auth.sms.textlocal.api_key',
  'auth.sms.vonage.api_secret',
  'auth.external.*.secret',
  'edge_runtime.secrets.*',
] as const

export function isSecretConfigField(configPath: string): boolean {
  const pathSegments = configPath.split('.')

  return SECRET_CONFIG_FIELDS.some((secretPath) => {
    const secretSegments = secretPath.split('.')
    if (secretSegments.length !== pathSegments.length) return false
    return secretSegments.every((segment, i) => segment === '*' || segment === pathSegments[i])
  })
}

export function getFieldDefinition(
  section: ConfigSection,
  fieldName: string
): ResolvedConfigFieldDefinition | undefined {
  const configPath = CONFIG_PATH_BY_SECTION_AND_FIELD.get(`${section}:${fieldName}`)
  if (configPath) return { ...CONFIG_FIELD_REGISTRY[configPath], configPath }
  if (section === 'auth') return getExternalAuthFieldDefinition(fieldName)
  return undefined
}

/**
 * A dashboard config section can nest fields arbitrarily deep (e.g. `storage.features.iceberg_catalog.enabled`),
 * mirroring how deep `gitHubConfigTomlSchema` itself nests. Recurse through plain objects — but not
 * arrays, which are leaf values — to produce one dot-joined field name per leaf.
 */
export function getSectionFieldEntries(
  section: ConfigSection,
  sectionConfig: Record<string, unknown>
): Array<{ fieldName: string; rawValue: unknown }> {
  const entries: Array<{ fieldName: string; rawValue: unknown }> = []

  function walk(value: unknown, path: string[]) {
    if (isRecord(value)) {
      for (const [key, nestedValue] of Object.entries(value)) walk(nestedValue, [...path, key])
      return
    }

    const joinedPath = path.join('.')
    entries.push({
      fieldName: section === 'auth' ? joinedPath.toUpperCase() : joinedPath,
      rawValue: value,
    })
  }

  for (const [key, value] of Object.entries(sectionConfig)) walk(value, [key])

  return entries
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

export function setConfigValue(
  config: Record<string, unknown>,
  configPath: string,
  value: unknown
): void {
  const segments = configPath.split('.')
  let target = config

  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(target[segment])) target[segment] = {}
    target = target[segment] as Record<string, unknown>
  }

  target[segments[segments.length - 1]] = value
}

function normalizeRedirectUrls(value: unknown): string[] {
  const urls = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []

  return Array.from(
    new Set(urls.filter((url): url is string => typeof url === 'string').map((url) => url.trim()))
  )
    .filter(Boolean)
    .sort()
}

const FILE_SIZE_PATTERN = /^(\d+(?:\.\d+)?)\s*(B|KB|KIB|MB|MIB|GB|GIB)?$/i
const FILE_SIZE_UNIT_ALIASES: Record<string, StorageSizeUnits> = {
  B: StorageSizeUnits.BYTES,
  KB: StorageSizeUnits.KB,
  KIB: StorageSizeUnits.KB,
  MB: StorageSizeUnits.MB,
  MIB: StorageSizeUnits.MB,
  GB: StorageSizeUnits.GB,
  GIB: StorageSizeUnits.GB,
}

/**
 * config.toml declares storage.file_size_limit as a human string (e.g. "50MiB"); the v2 project
 * config returns the same setting in bytes. Parse the former so both sides compare as bytes.
 */
function parseFileSizeToBytes(value: unknown): unknown {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return value

  const match = FILE_SIZE_PATTERN.exec(value.trim())
  if (!match) return value

  const [, amount, unitSuffix] = match
  const unit = unitSuffix
    ? FILE_SIZE_UNIT_ALIASES[unitSuffix.toUpperCase()]
    : StorageSizeUnits.BYTES
  if (!unit) return value

  return convertToBytes(Number(amount), unit)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
