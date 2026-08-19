import { type GitHubConfigToml } from './github-config.types'
import { StorageSizeUnits } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import { convertToBytes } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'

// Every top-level config.toml section, excluding `project_id` which is a scalar, not a section.
export const CONFIG_SECTIONS = [
  'api',
  'auth',
  'db',
  'storage',
  'realtime',
  'studio',
  'inbucket',
  'functions',
  'edge_runtime',
  'analytics',
  'remotes',
  'experimental',
] as const satisfies readonly Exclude<keyof GitHubConfigToml, 'project_id'>[]
export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

// The v2 project config API's own top-level section names — distinct from `CONFIG_SECTIONS`,
// which mirrors config.toml's naming (e.g. `pooler` here nests under config.toml's `db.pooler`).
const DASHBOARD_CONFIG_SECTIONS = [
  'api',
  'auth',
  'database',
  'pooler',
  'realtime',
  'storage',
] as const
type DashboardConfigSection = (typeof DASHBOARD_CONFIG_SECTIONS)[number]

export type ConfigDriftDashboardConfig = Partial<
  Record<DashboardConfigSection, Record<string, unknown>>
>

interface ConfigFieldDefinition {
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
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  'auth.enable_anonymous_sign_ins': {
    settingHref: toAuthProvidersHref,
  },
  'auth.enable_manual_linking': {
    settingHref: toAuthProvidersHref,
  },
  'auth.site_url': {
    settingHref: toAuthUrlConfigHref,
    hostedDefault: 'http://localhost:3000',
  },
  'auth.additional_redirect_urls': {
    settingHref: toAuthUrlConfigHref,
    hostedDefault: [],
    normalizeDashboardValue: normalizeRedirectUrls,
    normalizeGithubValue: normalizeRedirectUrls,
  },
  'auth.email.enable_signup': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.enable_signup': {
    settingHref: toAuthProvidersHref,
  },
  'auth.email.enable_confirmations': {
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  'auth.email.double_confirm_changes': {
    settingHref: toAuthProvidersHref,
  },
  'auth.email.otp_length': {
    settingHref: toAuthProvidersHref,
  },
  'auth.email.otp_expiry': {
    settingHref: toAuthProvidersHref,
  },
  'auth.minimum_password_length': {
    settingHref: toAuthProvidersHref,
  },
  'auth.password_requirements': {
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: (value) => (value === 'NO_REQUIRED_CHARS' ? '' : value),
  },
  'auth.sms.provider': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.enable_confirmations': {
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  'auth.sms.otp_expiry': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.otp_length': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.template': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio.account_sid': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio.message_service_sid': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio.content_sid': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio_verify.account_sid': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.twilio_verify.message_service_sid': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.messagebird.originator': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.textlocal.sender': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.vonage.from': {
    settingHref: toAuthProvidersHref,
  },
  'api.max_rows': {
    settingHref: toApiSettingsHref,
  },
  'storage.file_size_limit': {
    settingHref: toStorageSettingsHref,
    normalizeGithubValue: parseFileSizeToBytes,
  },
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

export function getFieldDefinition(fieldName: string): ResolvedConfigFieldDefinition | undefined {
  return { ...CONFIG_FIELD_REGISTRY[fieldName], configPath: fieldName }
}

/**
 * A dashboard config section can nest fields arbitrarily deep (e.g. `storage.features.iceberg_catalog.enabled`),
 * mirroring how deep `gitHubConfigTomlSchema` itself nests. Recurse through plain objects — but not
 * arrays, which are leaf values — to produce one dot-joined field name per leaf.
 */
export function getSectionFieldEntries(
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
      fieldName: joinedPath,
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
