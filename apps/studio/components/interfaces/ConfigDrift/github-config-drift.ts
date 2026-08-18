import { StorageSizeUnits } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import { convertToBytes } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'

type GitHubConfigFieldStatus = 'unmanaged' | 'managed' | 'drifted'

export const CONFIG_SECTIONS = ['api', 'auth', 'database', 'pooler', 'realtime', 'storage'] as const
export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

interface GitHubConfigFieldState {
  status: GitHubConfigFieldStatus
  configPath?: string
  settingHref?: (projectRef: string) => string
  githubValue?: unknown
}

export interface GitHubConfigDriftField {
  section: ConfigSection
  fieldName: string
  configPath: string
  settingHref: (projectRef: string) => string
  dashboardValue: unknown
  githubValue: unknown
}

export interface UnmanagedConfigField {
  section: ConfigSection
  fieldName: string
  dashboardValue: unknown
}

interface GitHubConfigDriftSummary {
  managedCount: number
  driftedFields: GitHubConfigDriftField[]
  unmanagedFields: UnmanagedConfigField[]
}

type ConfigDriftDashboardConfig = Partial<Record<ConfigSection, Record<string, unknown>>>

interface ConfigFieldDefinition {
  configPath: string
  settingHref: (projectRef: string) => string
  /** Value to compare against when the field is absent from a code-owned config.toml. */
  hostedDefault?: unknown
  normalizeDashboardValue?: (value: unknown) => unknown
  normalizeGithubValue?: (value: unknown) => unknown
}

const toAuthUrlConfigHref = (projectRef: string) => `/project/${projectRef}/auth/url-configuration`
const toAuthProvidersHref = (projectRef: string) => `/project/${projectRef}/auth/providers`
const toApiSettingsHref = (projectRef: string) => `/project/${projectRef}/settings/api`
const toStorageSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/storage/files/settings`

const invertBoolean = (value: unknown) => (typeof value === 'boolean' ? !value : value)

const AUTH_FIELD_REGISTRY: Record<string, ConfigFieldDefinition> = {
  DISABLE_SIGNUP: {
    configPath: 'auth.enable_signup',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  EXTERNAL_ANONYMOUS_USERS_ENABLED: {
    configPath: 'auth.enable_anonymous_sign_ins',
    settingHref: toAuthProvidersHref,
  },
  SECURITY_MANUAL_LINKING_ENABLED: {
    configPath: 'auth.enable_manual_linking',
    settingHref: toAuthProvidersHref,
  },
  SITE_URL: {
    configPath: 'auth.site_url',
    settingHref: toAuthUrlConfigHref,
    hostedDefault: 'http://localhost:3000',
  },
  URI_ALLOW_LIST: {
    configPath: 'auth.additional_redirect_urls',
    settingHref: toAuthUrlConfigHref,
    hostedDefault: [],
    normalizeDashboardValue: normalizeRedirectUrls,
    normalizeGithubValue: normalizeRedirectUrls,
  },
  EXTERNAL_EMAIL_ENABLED: {
    configPath: 'auth.email.enable_signup',
    settingHref: toAuthProvidersHref,
  },
  EXTERNAL_PHONE_ENABLED: {
    configPath: 'auth.sms.enable_signup',
    settingHref: toAuthProvidersHref,
  },
  MAILER_AUTOCONFIRM: {
    configPath: 'auth.email.enable_confirmations',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  MAILER_SECURE_EMAIL_CHANGE_ENABLED: {
    configPath: 'auth.email.double_confirm_changes',
    settingHref: toAuthProvidersHref,
  },
  MAILER_OTP_LENGTH: { configPath: 'auth.email.otp_length', settingHref: toAuthProvidersHref },
  MAILER_OTP_EXP: { configPath: 'auth.email.otp_expiry', settingHref: toAuthProvidersHref },
  PASSWORD_MIN_LENGTH: {
    configPath: 'auth.minimum_password_length',
    settingHref: toAuthProvidersHref,
  },
  PASSWORD_REQUIRED_CHARACTERS: {
    configPath: 'auth.password_requirements',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: (value) => (value === 'NO_REQUIRED_CHARS' ? '' : value),
  },
  SMS_PROVIDER: { configPath: 'auth.sms.provider', settingHref: toAuthProvidersHref },
  SMS_AUTOCONFIRM: {
    configPath: 'auth.sms.enable_confirmations',
    settingHref: toAuthProvidersHref,
    normalizeDashboardValue: invertBoolean,
  },
  SMS_OTP_EXP: { configPath: 'auth.sms.otp_expiry', settingHref: toAuthProvidersHref },
  SMS_OTP_LENGTH: { configPath: 'auth.sms.otp_length', settingHref: toAuthProvidersHref },
  SMS_TEMPLATE: { configPath: 'auth.sms.template', settingHref: toAuthProvidersHref },
  SMS_TWILIO_ACCOUNT_SID: {
    configPath: 'auth.sms.twilio.account_sid',
    settingHref: toAuthProvidersHref,
  },
  SMS_TWILIO_MESSAGE_SERVICE_SID: {
    configPath: 'auth.sms.twilio.message_service_sid',
    settingHref: toAuthProvidersHref,
  },
  SMS_TWILIO_CONTENT_SID: {
    configPath: 'auth.sms.twilio.content_sid',
    settingHref: toAuthProvidersHref,
  },
  SMS_TWILIO_VERIFY_ACCOUNT_SID: {
    configPath: 'auth.sms.twilio_verify.account_sid',
    settingHref: toAuthProvidersHref,
  },
  SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID: {
    configPath: 'auth.sms.twilio_verify.message_service_sid',
    settingHref: toAuthProvidersHref,
  },
  SMS_MESSAGEBIRD_ORIGINATOR: {
    configPath: 'auth.sms.messagebird.originator',
    settingHref: toAuthProvidersHref,
  },
  SMS_TEXTLOCAL_SENDER: {
    configPath: 'auth.sms.textlocal.sender',
    settingHref: toAuthProvidersHref,
  },
  SMS_VONAGE_FROM: { configPath: 'auth.sms.vonage.from', settingHref: toAuthProvidersHref },
}

const EXTERNAL_FIELD_SUFFIXES: ReadonlyArray<[suffix: string, configKey: string]> = [
  ['SKIP_NONCE_CHECK', 'skip_nonce_check'],
  ['EMAIL_OPTIONAL', 'email_optional'],
  ['REDIRECT_URI', 'redirect_uri'],
  ['CLIENT_ID', 'client_id'],
  ['ENABLED', 'enabled'],
  ['URL', 'url'],
]

function getExternalAuthFieldDefinition(fieldName: string): ConfigFieldDefinition | undefined {
  if (!fieldName.startsWith('EXTERNAL_')) return undefined

  const providerField = fieldName.slice('EXTERNAL_'.length)
  for (const [suffix, configKey] of EXTERNAL_FIELD_SUFFIXES) {
    const suffixWithSeparator = `_${suffix}`
    if (!providerField.endsWith(suffixWithSeparator)) continue

    const provider = providerField.slice(0, -suffixWithSeparator.length).toLowerCase()
    if (!provider) return undefined
    return {
      configPath: `auth.external.${provider}.${configKey}`,
      settingHref: toAuthProvidersHref,
    }
  }

  return undefined
}

const CONFIG_FIELD_REGISTRY: Record<ConfigSection, Record<string, ConfigFieldDefinition>> = {
  auth: AUTH_FIELD_REGISTRY,
  api: {
    max_rows: { configPath: 'api.max_rows', settingHref: toApiSettingsHref },
  },
  storage: {
    file_size_limit: {
      configPath: 'storage.file_size_limit',
      settingHref: toStorageSettingsHref,
      normalizeGithubValue: parseFileSizeToBytes,
    },
  },
  database: {},
  pooler: {},
  realtime: {},
}

const SECRET_FIELD_PATTERN = /(?:SECRET|TOKEN|API_KEY|ACCESS_KEY)$/

function getFieldDefinition(
  section: ConfigSection,
  fieldName: string
): ConfigFieldDefinition | undefined {
  const staticDefinition = CONFIG_FIELD_REGISTRY[section][fieldName]
  if (staticDefinition) return staticDefinition
  if (section === 'auth') return getExternalAuthFieldDefinition(fieldName)
  return undefined
}

function getConfigFieldState({
  section,
  fieldName,
  githubFormattedDashboardConfig,
  githubConfig,
}: {
  section: ConfigSection
  fieldName: string
  githubFormattedDashboardConfig: Record<string, unknown>
  githubConfig?: Record<string, unknown>
}): GitHubConfigFieldState {
  if (SECRET_FIELD_PATTERN.test(fieldName)) return { status: 'unmanaged' }

  const definition = getFieldDefinition(section, fieldName)
  if (!definition || !githubConfig) return { status: 'unmanaged' }

  const normalizedDashboardValue = getConfigValue(
    githubFormattedDashboardConfig,
    definition.configPath
  )

  let githubValue = getConfigValue(githubConfig, definition.configPath)
  if (githubValue === undefined) {
    const isCodeOwned = getConfigValue(githubConfig, 'config_source') === 'code'
    if (!isCodeOwned || definition.hostedDefault === undefined) return { status: 'unmanaged' }

    const normalizedDefaultValue =
      definition.normalizeGithubValue?.(definition.hostedDefault) ?? definition.hostedDefault
    if (valuesMatch(normalizedDashboardValue, normalizedDefaultValue)) {
      return { status: 'unmanaged' }
    }

    githubValue = definition.hostedDefault
  }

  const normalizedGithubValue = definition.normalizeGithubValue?.(githubValue) ?? githubValue
  return {
    status: valuesMatch(normalizedDashboardValue, normalizedGithubValue) ? 'managed' : 'drifted',
    configPath: definition.configPath,
    settingHref: definition.settingHref,
    githubValue,
  }
}

export function getConfigDriftSummary({
  dashboardConfig,
  githubConfig,
}: {
  dashboardConfig?: ConfigDriftDashboardConfig
  githubConfig?: Record<string, unknown>
}): GitHubConfigDriftSummary {
  if (!dashboardConfig || !githubConfig) {
    return { managedCount: 0, driftedFields: [], unmanagedFields: [] }
  }

  const githubFormattedDashboardConfig = convertProjectConfigToGitHubConfig(dashboardConfig)

  let managedCount = 0
  const driftedFields: GitHubConfigDriftField[] = []
  const unmanagedFields: UnmanagedConfigField[] = []

  for (const section of CONFIG_SECTIONS) {
    const sectionConfig = dashboardConfig[section]
    if (!sectionConfig) continue

    for (const [rawFieldName, rawValue] of Object.entries(sectionConfig)) {
      const fieldName = section === 'auth' ? rawFieldName.toUpperCase() : rawFieldName
      const state = getConfigFieldState({
        section,
        fieldName,
        githubFormattedDashboardConfig,
        githubConfig,
      })

      if (state.status === 'managed') {
        managedCount += 1
        continue
      }
      if (state.status === 'unmanaged' || !state.configPath || !state.settingHref) {
        unmanagedFields.push({ section, fieldName, dashboardValue: rawValue })
        continue
      }

      driftedFields.push({
        section,
        fieldName,
        configPath: state.configPath,
        settingHref: state.settingHref,
        dashboardValue: rawValue,
        githubValue: state.githubValue,
      })
    }
  }

  return { managedCount, driftedFields, unmanagedFields }
}

function getConfigValue(config: Record<string, unknown>, configPath: string): unknown {
  let value: unknown = config

  for (const segment of configPath.split('.')) {
    if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, segment)) {
      return undefined
    }
    value = value[segment]
  }

  return value
}

function setConfigValue(config: Record<string, unknown>, configPath: string, value: unknown): void {
  const segments = configPath.split('.')
  let target = config

  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(target[segment])) target[segment] = {}
    target = target[segment] as Record<string, unknown>
  }

  target[segments[segments.length - 1]] = value
}

/**
 * Reshapes a project's dashboard config (sections keyed by section name, fields in their
 * dashboard-native naming) into the nested, dotted-path shape of a parsed config.toml — using the
 * same field registry `getConfigFieldState` compares against, so only trackable fields carry over.
 */
export function convertProjectConfigToGitHubConfig(
  dashboardConfig?: ConfigDriftDashboardConfig
): Record<string, unknown> {
  const githubConfig: Record<string, unknown> = {}
  if (!dashboardConfig) return githubConfig

  for (const section of CONFIG_SECTIONS) {
    const sectionConfig = dashboardConfig[section]
    if (!sectionConfig) continue

    for (const [rawFieldName, rawValue] of Object.entries(sectionConfig)) {
      const fieldName = section === 'auth' ? rawFieldName.toUpperCase() : rawFieldName
      if (SECRET_FIELD_PATTERN.test(fieldName)) continue

      const definition = getFieldDefinition(section, fieldName)
      if (!definition) continue

      const value = definition.normalizeDashboardValue?.(rawValue) ?? rawValue
      setConfigValue(githubConfig, definition.configPath, value)
    }
  }

  return githubConfig
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
