import {
  type GitHubConfigDriftField,
  type UnmanagedConfigField,
} from '@/components/interfaces/ConfigDrift/github-config-drift'
import {
  CONFIG_SECTIONS,
  normalizeRedirectUrls,
  type ConfigSection,
} from '@/components/interfaces/ConfigDrift/github-config-field-registry'

/** Keyed by config.toml path — the single identifier a drifted or unmanaged field carries. */
const FIELD_LABELS: Record<string, string> = {
  'auth.enable_signup': 'New user signups',
  'auth.enable_anonymous_sign_ins': 'Anonymous sign-ins',
  'auth.enable_manual_linking': 'Manual account linking',
  'auth.site_url': 'Site URL',
  'auth.additional_redirect_urls': 'Redirect URLs',
  'auth.email.enable_signup': 'Email signups',
  'auth.sms.enable_signup': 'Phone signups',
  'auth.email.enable_confirmations': 'Email confirmations',
  'auth.email.double_confirm_changes': 'Secure email change',
  'auth.email.otp_length': 'Email OTP length',
  'auth.email.otp_expiry': 'Email OTP expiry',
  'auth.minimum_password_length': 'Minimum password length',
  'auth.password_requirements': 'Password requirements',
  'auth.sms.provider': 'SMS provider',
  'auth.sms.enable_confirmations': 'SMS confirmations',
  'auth.sms.otp_expiry': 'SMS OTP expiry',
  'auth.sms.otp_length': 'SMS OTP length',
  'auth.sms.template': 'SMS template',
  'api.max_rows': 'Max rows',
  'storage.file_size_limit': 'File size limit',
  'api.enabled': 'API enabled',
  'api.port': 'API port',
  'api.schemas': 'Exposed schemas',
  'api.extra_search_path': 'Extra search path',
  'api.tls.enabled': 'Enforce TLS',
  'db.port': 'Database port',
  'db.shadow_port': 'Shadow database port',
  'db.major_version': 'Postgres major version',
  'db.pooler.enabled': 'Connection pooler enabled',
  'db.pooler.port': 'Pooler port',
  'db.pooler.pool_mode': 'Pool mode',
  'db.pooler.default_pool_size': 'Default pool size',
  'db.pooler.max_client_conn': 'Max client connections',
  'db.migrations.enabled': 'Migrations enabled',
  'db.migrations.schema_paths': 'Migration schema paths',
  'db.seed.enabled': 'Seed enabled',
  'db.seed.sql_paths': 'Seed file paths',
  'db.network_restrictions.enabled': 'Network restrictions enabled',
  'db.network_restrictions.allowed_cidrs': 'Allowed CIDRs (IPv4)',
  'db.network_restrictions.allowed_cidrs_v6': 'Allowed CIDRs (IPv6)',
  'realtime.enabled': 'Realtime enabled',
  'studio.enabled': 'Studio enabled',
  'studio.port': 'Studio port',
  'studio.api_url': 'Studio API URL',
  'inbucket.enabled': 'Inbucket enabled',
  'inbucket.port': 'Inbucket port',
  'storage.enabled': 'Storage enabled',
  'storage.s3_protocol.enabled': 'S3 protocol enabled',
  'storage.analytics.enabled': 'Storage analytics enabled',
  'storage.analytics.max_namespaces': 'Max analytics namespaces',
  'storage.analytics.max_tables': 'Max analytics tables',
  'storage.analytics.max_catalogs': 'Max analytics catalogs',
  'storage.vector.enabled': 'Storage vector enabled',
  'storage.vector.max_buckets': 'Max vector buckets',
  'storage.vector.max_indexes': 'Max vector indexes',
  'auth.enabled': 'Auth enabled',
  'auth.jwt_expiry': 'JWT expiry',
  'auth.enable_refresh_token_rotation': 'Refresh token rotation',
  'auth.refresh_token_reuse_interval': 'Refresh token reuse interval',
  'auth.rate_limit.email_sent': 'Email rate limit',
  'auth.rate_limit.sms_sent': 'SMS rate limit',
  'auth.rate_limit.anonymous_users': 'Anonymous sign-in rate limit',
  'auth.rate_limit.token_refresh': 'Token refresh rate limit',
  'auth.rate_limit.sign_in_sign_ups': 'Sign-in/sign-up rate limit',
  'auth.rate_limit.token_verifications': 'Token verification rate limit',
  'auth.rate_limit.web3': 'Web3 rate limit',
  'auth.email.secure_password_change': 'Secure email change',
  'auth.email.max_frequency': 'Email send frequency limit',
  'auth.sms.max_frequency': 'SMS send frequency limit',
  'auth.sms.twilio.enabled': 'Twilio enabled',
  'auth.mfa.max_enrolled_factors': 'Max enrolled MFA factors',
  'auth.mfa.totp.enroll_enabled': 'TOTP enrollment',
  'auth.mfa.totp.verify_enabled': 'TOTP verification',
  'auth.mfa.phone.enroll_enabled': 'Phone MFA enrollment',
  'auth.mfa.phone.verify_enabled': 'Phone MFA verification',
  'auth.mfa.phone.otp_length': 'Phone MFA OTP length',
  'auth.mfa.phone.template': 'Phone MFA template',
  'auth.mfa.phone.max_frequency': 'Phone MFA send frequency limit',
  'auth.web3.solana.enabled': 'Solana Web3 enabled',
  'auth.oauth_server.enabled': 'OAuth server enabled',
  'auth.oauth_server.authorization_url_path': 'OAuth authorization URL path',
  'auth.oauth_server.allow_dynamic_registration': 'Allow dynamic client registration',
  'edge_runtime.enabled': 'Edge runtime enabled',
  'edge_runtime.policy': 'Edge runtime policy',
  'edge_runtime.inspector_port': 'Edge runtime inspector port',
  'edge_runtime.deno_version': 'Deno version',
  'analytics.enabled': 'Analytics enabled',
  'analytics.port': 'Analytics port',
  'analytics.backend': 'Analytics backend',
  'experimental.orioledb_version': 'OrioleDB version',
  'experimental.s3_host': 'S3 host',
  'experimental.s3_region': 'S3 region',
  'experimental.s3_access_key': 'S3 access key',
  'experimental.s3_secret_key': 'S3 secret key',
}

/** config.toml path of the redirect URL list, which renders as an added/removed diff, not a scalar. */
const REDIRECT_URLS_CONFIG_PATH = 'auth.additional_redirect_urls'

const CONFIG_KEY_LABELS: Record<string, string> = {
  client_id: 'Client ID',
  email_optional: 'Email optional',
  enabled: 'Enabled',
  redirect_uri: 'Redirect URI',
  skip_nonce_check: 'Skip nonce check',
  url: 'URL',
}

const PROVIDER_LABELS: Record<string, string> = {
  apple: 'Apple',
  azure: 'Azure',
  bitbucket: 'Bitbucket',
  discord: 'Discord',
  facebook: 'Facebook',
  figma: 'Figma',
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
  kakao: 'Kakao',
  keycloak: 'Keycloak',
  linkedin_oidc: 'LinkedIn (OIDC)',
  notion: 'Notion',
  slack_oidc: 'Slack (OIDC)',
  spotify: 'Spotify',
  twitch: 'Twitch',
  workos: 'WorkOS',
  zoom: 'Zoom',
}

const CONFIG_SECTION_LABELS: Record<ConfigSection, string> = {
  api: 'API',
  auth: 'Auth',
  db: 'Database',
  realtime: 'Realtime',
  storage: 'Storage',
  workers: 'Workers',
  experimental: 'Experimental',
}

interface ConfigurationIssueRowMeta {
  settingLabel: string
  settingHref: string
  valueDiff: ConfigurationDriftValueDiff
}

export type ConfigurationDriftRow = Omit<GitHubConfigDriftField, 'settingHref'> &
  ConfigurationIssueRowMeta & { status: 'drifted' }

type ConfigurationDriftValueDiff =
  | {
      kind: 'list'
      onlyInDashboard: string[]
      onlyInConfig: string[]
    }
  | {
      kind: 'scalar'
      dashboardValue: string
      configValue: string
    }

interface UnmanagedConfigRow {
  configPath: string
  label: string
  value: string
}

export interface UnmanagedConfigSectionGroup {
  section: ConfigSection
  sectionLabel: string
  rows: UnmanagedConfigRow[]
}

export function createConfigurationDriftRows(
  fields: GitHubConfigDriftField[],
  projectRef: string
): ConfigurationDriftRow[] {
  return fields.map((field) => ({
    ...field,
    status: 'drifted' as const,
    settingLabel: getConfigFieldLabel(field.configPath),
    settingHref: field.settingHref(projectRef),
    valueDiff: createConfigurationDriftValueDiff(field),
  }))
}

export function groupUnmanagedConfigFields(
  fields: readonly UnmanagedConfigField[]
): UnmanagedConfigSectionGroup[] {
  const bySection = new Map<ConfigSection, UnmanagedConfigRow[]>()

  for (const field of fields) {
    const rows = bySection.get(field.section) ?? []
    rows.push({
      configPath: field.configPath,
      label: getConfigFieldLabel(field.configPath),
      value: formatConfigFieldValue(field.configPath, field.dashboardValue),
    })
    bySection.set(field.section, rows)
  }

  return CONFIG_SECTIONS.filter((section) => bySection.has(section)).map((section) => ({
    section,
    sectionLabel: CONFIG_SECTION_LABELS[section],
    rows: bySection.get(section)!,
  }))
}

function formatConfigFieldValue(configPath: string, value: unknown): string {
  const normalizedValue =
    configPath === REDIRECT_URLS_CONFIG_PATH ? normalizeRedirectUrls(value) : value

  if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
    return 'Not set'
  }
  if (Array.isArray(normalizedValue)) {
    return normalizedValue.length === 0
      ? 'Not set'
      : normalizedValue.map((item) => formatScalarValue(item)).join('\n')
  }

  return formatScalarValue(normalizedValue)
}

function createConfigurationDriftValueDiff(
  field: GitHubConfigDriftField
): ConfigurationDriftValueDiff {
  if (field.configPath === REDIRECT_URLS_CONFIG_PATH) {
    const dashboardUrls = normalizeRedirectUrls(field.dashboardValue)
    const configUrls = normalizeRedirectUrls(field.githubValue)
    const dashboardUrlSet = new Set(dashboardUrls)
    const configUrlSet = new Set(configUrls)

    return {
      kind: 'list',
      onlyInDashboard: dashboardUrls.filter((url) => !configUrlSet.has(url)),
      onlyInConfig: configUrls.filter((url) => !dashboardUrlSet.has(url)),
    }
  }

  return {
    kind: 'scalar',
    dashboardValue: formatConfigFieldValue(field.configPath, field.dashboardValue),
    configValue: formatConfigFieldValue(field.configPath, field.githubValue),
  }
}

/**
 * Prefers a hand-written label, then the `auth.external.<provider>.<key>` shape, and otherwise
 * title-cases the last path segment — never the whole path, which would leave the dots in.
 */
function getConfigFieldLabel(configPath: string): string {
  const staticLabel = FIELD_LABELS[configPath]
  if (staticLabel) return staticLabel

  const [, section, provider, configKey] = configPath.split('.')
  if (section === 'external' && provider && configKey) {
    return `${formatProviderLabel(provider)} · ${CONFIG_KEY_LABELS[configKey] ?? titleCase(configKey)}`
  }

  return titleCase(configPath.split('.').at(-1) ?? configPath)
}

function formatScalarValue(value: unknown): string {
  if (typeof value === 'string') return value || 'Not set'
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value, null, 2) ?? 'Not set'
}

function formatProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? titleCase(provider)
}

function titleCase(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}
