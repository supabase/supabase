import type { GitHubConfigDriftField } from '@/lib/github-config-drift'

const AUTH_FIELD_LABELS: Record<string, string> = {
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

interface ConfigurationIssueRowMeta {
  settingLabel: string
  settingHref: string
  valueDiff: ConfigurationDriftValueDiff
}

export type ConfigurationDriftRow = ConfigurationIssueRowMeta &
  GitHubConfigDriftField & { status: 'drifted' }

export type ConfigurationDriftValueDiff =
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

export function createConfigurationDriftRows(
  fields: GitHubConfigDriftField[],
  projectRef: string
): ConfigurationDriftRow[] {
  return fields.map((field) => ({
    ...field,
    status: 'drifted' as const,
    settingLabel: getAuthSettingLabel(field),
    settingHref: getAuthSettingHref(field.fieldName, projectRef),
    valueDiff: createConfigurationDriftValueDiff(field),
  }))
}

export function formatAuthConfigValue(fieldName: string, value: unknown): string {
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
    dashboardValue: formatAuthConfigValue(field.fieldName, field.dashboardValue),
    configValue: formatAuthConfigValue(field.fieldName, field.githubValue),
  }
}

function getAuthSettingLabel(
  field: Pick<GitHubConfigDriftField, 'fieldName' | 'configPath'>
): string {
  const staticLabel = AUTH_FIELD_LABELS[field.fieldName]
  if (staticLabel) return staticLabel

  const [, section, provider, configKey] = field.configPath.split('.')
  if (section === 'external' && provider && configKey) {
    return `${formatProviderLabel(provider)} · ${CONFIG_KEY_LABELS[configKey] ?? titleCase(configKey)}`
  }

  return titleCase(field.configPath.split('.').at(-1) ?? field.fieldName)
}

function getAuthSettingHref(fieldName: string, projectRef: string): string {
  const page = ['SITE_URL', 'URI_ALLOW_LIST'].includes(fieldName)
    ? 'url-configuration'
    : 'providers'
  return `/project/${projectRef}/auth/${page}`
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
