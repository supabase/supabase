import {
  type GitHubConfigDriftField,
  type UnmanagedConfigField,
} from '@/components/interfaces/ConfigDrift/github-config-drift'
import {
  CONFIG_SECTIONS,
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
  storage: 'Storage',
  realtime: 'Realtime',
  studio: 'Studio',
  inbucket: 'Inbucket',
  functions: 'Edge Functions',
  edge_runtime: 'Edge Runtime',
  analytics: 'Analytics',
  remotes: 'Remotes',
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

function normalizeRedirectUrls(value: unknown): string[] {
  const urls = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []

  return Array.from(
    new Set(urls.filter((url): url is string => typeof url === 'string').map((url) => url.trim()))
  )
    .filter(Boolean)
    .sort()
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
