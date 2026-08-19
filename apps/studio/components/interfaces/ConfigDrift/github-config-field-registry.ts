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
  normalizeGithubValue?: (value: unknown) => unknown
}

export type ResolvedConfigFieldDefinition = ConfigFieldDefinition & { configPath: string }

// external_<provider>_enabled/client_id/email_optional/skip_nonce_check is the dashboard's flat
// naming for every OAuth provider; a handful of self-hosted providers also expose `_url`.
// external_<provider>_secret is always a secret and is never read here.
export const EXTERNAL_AUTH_PROVIDERS = [
  'apple',
  'azure',
  'bitbucket',
  'discord',
  'facebook',
  'figma',
  'github',
  'gitlab',
  'google',
  'kakao',
  'keycloak',
  'linkedin_oidc',
  'notion',
  'slack',
  'slack_oidc',
  'spotify',
  'twitch',
  'twitter',
  'x',
  'workos',
  'zoom',
] as const

export const EXTERNAL_AUTH_PROVIDERS_WITH_URL = new Set(['azure', 'gitlab', 'keycloak', 'workos'])

const toAuthUrlConfigHref = (projectRef: string) => `/project/${projectRef}/auth/url-configuration`
const toAuthProvidersHref = (projectRef: string) => `/project/${projectRef}/auth/providers`
const toApiSettingsHref = (projectRef: string) => `/project/${projectRef}/settings/api`
const toStorageSettingsHref = (projectRef: string) =>
  `/project/${projectRef}/storage/files/settings`
const toProjectHref = (projectRef: string) => `/project/${projectRef}`

/**
 * Every trackable field across every section, keyed by its config.toml dotted path — the same shape
 * `getConfigValue`/`setConfigValue` address, and the single identifier a field is known by once the
 * dashboard config has been run through `convertProjectConfigToGitHubConfig`.
 */
const CONFIG_FIELD_REGISTRY: Record<string, ConfigFieldDefinition> = {
  'auth.enable_signup': {
    settingHref: toAuthProvidersHref,
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
  },
  'auth.sms.provider': {
    settingHref: toAuthProvidersHref,
  },
  'auth.sms.enable_confirmations': {
    settingHref: toAuthProvidersHref,
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
  'api.enabled': {
    settingHref: toProjectHref,
  },
  'api.port': {
    settingHref: toProjectHref,
  },
  'api.schemas': {
    settingHref: toProjectHref,
  },
  'api.extra_search_path': {
    settingHref: toProjectHref,
  },
  'api.tls.enabled': {
    settingHref: toProjectHref,
  },
  'db.port': {
    settingHref: toProjectHref,
  },
  'db.shadow_port': {
    settingHref: toProjectHref,
  },
  'db.major_version': {
    settingHref: toProjectHref,
  },
  'db.pooler.enabled': {
    settingHref: toProjectHref,
  },
  'db.pooler.port': {
    settingHref: toProjectHref,
  },
  'db.pooler.pool_mode': {
    settingHref: toProjectHref,
  },
  'db.pooler.default_pool_size': {
    settingHref: toProjectHref,
  },
  'db.pooler.max_client_conn': {
    settingHref: toProjectHref,
  },
  'db.migrations.enabled': {
    settingHref: toProjectHref,
  },
  'db.migrations.schema_paths': {
    settingHref: toProjectHref,
  },
  'db.seed.enabled': {
    settingHref: toProjectHref,
  },
  'db.seed.sql_paths': {
    settingHref: toProjectHref,
  },
  'db.network_restrictions.enabled': {
    settingHref: toProjectHref,
  },
  'db.network_restrictions.allowed_cidrs': {
    settingHref: toProjectHref,
  },
  'db.network_restrictions.allowed_cidrs_v6': {
    settingHref: toProjectHref,
  },
  'realtime.enabled': {
    settingHref: toProjectHref,
  },
  'studio.enabled': {
    settingHref: toProjectHref,
  },
  'studio.port': {
    settingHref: toProjectHref,
  },
  'studio.api_url': {
    settingHref: toProjectHref,
  },
  'inbucket.enabled': {
    settingHref: toProjectHref,
  },
  'inbucket.port': {
    settingHref: toProjectHref,
  },
  'storage.enabled': {
    settingHref: toProjectHref,
  },
  'storage.s3_protocol.enabled': {
    settingHref: toProjectHref,
  },
  'storage.analytics.enabled': {
    settingHref: toProjectHref,
  },
  'storage.analytics.max_namespaces': {
    settingHref: toProjectHref,
  },
  'storage.analytics.max_tables': {
    settingHref: toProjectHref,
  },
  'storage.analytics.max_catalogs': {
    settingHref: toProjectHref,
  },
  'storage.vector.enabled': {
    settingHref: toProjectHref,
  },
  'storage.vector.max_buckets': {
    settingHref: toProjectHref,
  },
  'storage.vector.max_indexes': {
    settingHref: toProjectHref,
  },
  'auth.enabled': {
    settingHref: toProjectHref,
  },
  'auth.jwt_expiry': {
    settingHref: toProjectHref,
  },
  'auth.enable_refresh_token_rotation': {
    settingHref: toProjectHref,
  },
  'auth.refresh_token_reuse_interval': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.email_sent': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.sms_sent': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.anonymous_users': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.token_refresh': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.sign_in_sign_ups': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.token_verifications': {
    settingHref: toProjectHref,
  },
  'auth.rate_limit.web3': {
    settingHref: toProjectHref,
  },
  'auth.email.secure_password_change': {
    settingHref: toProjectHref,
  },
  'auth.email.max_frequency': {
    settingHref: toProjectHref,
  },
  'auth.sms.max_frequency': {
    settingHref: toProjectHref,
  },
  'auth.sms.twilio.enabled': {
    settingHref: toProjectHref,
  },
  'auth.mfa.max_enrolled_factors': {
    settingHref: toProjectHref,
  },
  'auth.mfa.totp.enroll_enabled': {
    settingHref: toProjectHref,
  },
  'auth.mfa.totp.verify_enabled': {
    settingHref: toProjectHref,
  },
  'auth.mfa.phone.enroll_enabled': {
    settingHref: toProjectHref,
  },
  'auth.mfa.phone.verify_enabled': {
    settingHref: toProjectHref,
  },
  'auth.mfa.phone.otp_length': {
    settingHref: toProjectHref,
  },
  'auth.mfa.phone.template': {
    settingHref: toProjectHref,
  },
  'auth.mfa.phone.max_frequency': {
    settingHref: toProjectHref,
  },
  'auth.web3.solana.enabled': {
    settingHref: toProjectHref,
  },
  'auth.oauth_server.enabled': {
    settingHref: toProjectHref,
  },
  'auth.oauth_server.authorization_url_path': {
    settingHref: toProjectHref,
  },
  'auth.oauth_server.allow_dynamic_registration': {
    settingHref: toProjectHref,
  },
  'edge_runtime.enabled': {
    settingHref: toProjectHref,
  },
  'edge_runtime.policy': {
    settingHref: toProjectHref,
  },
  'edge_runtime.inspector_port': {
    settingHref: toProjectHref,
  },
  'edge_runtime.deno_version': {
    settingHref: toProjectHref,
  },
  'analytics.enabled': {
    settingHref: toProjectHref,
  },
  'analytics.port': {
    settingHref: toProjectHref,
  },
  'analytics.backend': {
    settingHref: toProjectHref,
  },
  'experimental.orioledb_version': {
    settingHref: toProjectHref,
  },
  'experimental.s3_host': {
    settingHref: toProjectHref,
  },
  'experimental.s3_region': {
    settingHref: toProjectHref,
  },
  'experimental.s3_access_key': {
    settingHref: toProjectHref,
  },
  'experimental.s3_secret_key': {
    settingHref: toProjectHref,
  },
}

for (const provider of EXTERNAL_AUTH_PROVIDERS) {
  for (const field of ['enabled', 'client_id', 'email_optional', 'skip_nonce_check']) {
    CONFIG_FIELD_REGISTRY[`auth.external.${provider}.${field}`] = {
      settingHref: toAuthProvidersHref,
    }
  }
  if (EXTERNAL_AUTH_PROVIDERS_WITH_URL.has(provider)) {
    CONFIG_FIELD_REGISTRY[`auth.external.${provider}.url`] = { settingHref: toAuthProvidersHref }
  }
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
  'experimental.s3_access_key',
  'experimental.s3_secret_key',
] as const

export function isSecretConfigField(configPath: string): boolean {
  const pathSegments = configPath.split('.')

  return SECRET_CONFIG_FIELDS.some((secretPath) => {
    const secretSegments = secretPath.split('.')
    const isPrefixPattern = secretSegments[secretSegments.length - 1] === '*'
    if (isPrefixPattern) {
      if (pathSegments.length < secretSegments.length) return false
    } else if (secretSegments.length !== pathSegments.length) {
      return false
    }
    return secretSegments.every((segment, i) => segment === '*' || segment === pathSegments[i])
  })
}

export function getFieldDefinition(configPath: string): ResolvedConfigFieldDefinition | undefined {
  const definition = CONFIG_FIELD_REGISTRY[configPath]
  if (!definition) return undefined
  return { ...definition, configPath }
}

/**
 * A config section can nest fields arbitrarily deep (e.g. `storage.analytics.max_namespaces`),
 * mirroring how deep `gitHubConfigTomlSchema` itself nests. Recurse through plain objects — but not
 * arrays, which are leaf values — to produce one section-prefixed dotted path per leaf, matching how
 * `CONFIG_FIELD_REGISTRY` is keyed.
 */
export function getSectionFieldEntries(
  section: ConfigSection,
  sectionConfig: Record<string, unknown>
): Array<{ configPath: string; rawValue: unknown }> {
  const entries: Array<{ configPath: string; rawValue: unknown }> = []

  function walk(value: unknown, path: string[]) {
    if (isRecord(value)) {
      for (const [key, nestedValue] of Object.entries(value)) walk(nestedValue, [...path, key])
      return
    }

    entries.push({
      configPath: path.join('.'),
      rawValue: value,
    })
  }

  for (const [key, value] of Object.entries(sectionConfig)) walk(value, [section, key])

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

/**
 * A redirect allow-list is a set, not a sequence: accepts either a comma-separated string or an
 * array, and returns trimmed, deduped, sorted entries so two lists holding the same URLs compare
 * equal regardless of how they were written.
 */
export function normalizeRedirectUrls(value: unknown): string[] {
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
