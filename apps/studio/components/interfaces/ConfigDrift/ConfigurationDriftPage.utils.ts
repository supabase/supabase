import {
  CONFIG_SECTIONS,
  type ConfigSection,
  type GitHubConfigDriftField,
  type UnmanagedConfigField,
} from '@/components/interfaces/ConfigDrift/github-config-drift'

const FIELD_LABELS: Record<string, string> = {
  DISABLE_SIGNUP: 'New user signups',
  EXTERNAL_ANONYMOUS_USERS_ENABLED: 'Anonymous sign-ins',
  SECURITY_MANUAL_LINKING_ENABLED: 'Manual account linking',
  SITE_URL: 'Site URL',
  URI_ALLOW_LIST: 'Redirect URLs',
  EXTERNAL_EMAIL_ENABLED: 'Email signups',
  EXTERNAL_PHONE_ENABLED: 'Phone signups',
  MAILER_AUTOCONFIRM: 'Email confirmations',
  MAILER_SECURE_EMAIL_CHANGE_ENABLED: 'Secure email change',
  MAILER_OTP_LENGTH: 'Email OTP length',
  MAILER_OTP_EXP: 'Email OTP expiry',
  PASSWORD_MIN_LENGTH: 'Minimum password length',
  PASSWORD_REQUIRED_CHARACTERS: 'Password requirements',
  SMS_PROVIDER: 'SMS provider',
  SMS_AUTOCONFIRM: 'SMS confirmations',
  SMS_OTP_EXP: 'SMS OTP expiry',
  SMS_OTP_LENGTH: 'SMS OTP length',
  SMS_TEMPLATE: 'SMS template',
  max_rows: 'Max rows',
  file_size_limit: 'File size limit',
}

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
  database: 'Database',
  pooler: 'Pooler',
  realtime: 'Realtime',
  storage: 'Storage',
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
  fieldName: string
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
    settingLabel: getSettingLabel(field),
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
      fieldName: field.fieldName,
      label: titleCase(field.fieldName),
      value: formatConfigFieldValue(field.fieldName, field.dashboardValue),
    })
    bySection.set(field.section, rows)
  }

  return CONFIG_SECTIONS.filter((section) => bySection.has(section)).map((section) => ({
    section,
    sectionLabel: CONFIG_SECTION_LABELS[section],
    rows: bySection.get(section)!,
  }))
}

function formatConfigFieldValue(fieldName: string, value: unknown): string {
  const normalizedValue = fieldName === 'URI_ALLOW_LIST' ? normalizeRedirectUrls(value) : value

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
  if (field.fieldName === 'URI_ALLOW_LIST') {
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
    dashboardValue: formatConfigFieldValue(field.fieldName, field.dashboardValue),
    configValue: formatConfigFieldValue(field.fieldName, field.githubValue),
  }
}

function getSettingLabel(field: Pick<GitHubConfigDriftField, 'fieldName' | 'configPath'>): string {
  const staticLabel = FIELD_LABELS[field.fieldName]
  if (staticLabel) return staticLabel

  const [, section, provider, configKey] = field.configPath.split('.')
  if (section === 'external' && provider && configKey) {
    return `${formatProviderLabel(provider)} · ${CONFIG_KEY_LABELS[configKey] ?? titleCase(configKey)}`
  }

  return titleCase(field.configPath.split('.').at(-1) ?? field.fieldName)
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
