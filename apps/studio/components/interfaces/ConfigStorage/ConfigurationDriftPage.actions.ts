import type { components } from '@/data/api'
import { getAuthFieldConfigPath, type GitHubConfigDriftField } from '@/lib/github-config-drift'

export type AuthConfigRestorePayload = Partial<components['schemas']['UpdateGoTrueConfigBody']>

export type AuthConfigRestorePayloadResult =
  | { ok: true; payload: AuthConfigRestorePayload }
  | { ok: false; error: string }

const SECRET_FIELD_PATTERN = /(?:SECRET|TOKEN|API_KEY|ACCESS_KEY)$/
const INVERSE_BOOLEAN_FIELDS = new Set(['DISABLE_SIGNUP', 'MAILER_AUTOCONFIRM', 'SMS_AUTOCONFIRM'])

const BOOLEAN_FIELDS = new Set([
  'EXTERNAL_EMAIL_ENABLED',
  'EXTERNAL_PHONE_ENABLED',
  'MAILER_SECURE_EMAIL_CHANGE_ENABLED',
  'EXTERNAL_ANONYMOUS_USERS_ENABLED',
  'SECURITY_MANUAL_LINKING_ENABLED',
  'EXTERNAL_APPLE_EMAIL_OPTIONAL',
  'EXTERNAL_APPLE_ENABLED',
  'EXTERNAL_AZURE_EMAIL_OPTIONAL',
  'EXTERNAL_AZURE_ENABLED',
  'EXTERNAL_BITBUCKET_EMAIL_OPTIONAL',
  'EXTERNAL_BITBUCKET_ENABLED',
  'EXTERNAL_DISCORD_EMAIL_OPTIONAL',
  'EXTERNAL_DISCORD_ENABLED',
  'EXTERNAL_FACEBOOK_EMAIL_OPTIONAL',
  'EXTERNAL_FACEBOOK_ENABLED',
  'EXTERNAL_FIGMA_EMAIL_OPTIONAL',
  'EXTERNAL_FIGMA_ENABLED',
  'EXTERNAL_GITHUB_EMAIL_OPTIONAL',
  'EXTERNAL_GITHUB_ENABLED',
  'EXTERNAL_GITLAB_EMAIL_OPTIONAL',
  'EXTERNAL_GITLAB_ENABLED',
  'EXTERNAL_GOOGLE_EMAIL_OPTIONAL',
  'EXTERNAL_GOOGLE_ENABLED',
  'EXTERNAL_GOOGLE_SKIP_NONCE_CHECK',
  'EXTERNAL_KAKAO_EMAIL_OPTIONAL',
  'EXTERNAL_KAKAO_ENABLED',
  'EXTERNAL_KEYCLOAK_EMAIL_OPTIONAL',
  'EXTERNAL_KEYCLOAK_ENABLED',
  'EXTERNAL_LINKEDIN_OIDC_EMAIL_OPTIONAL',
  'EXTERNAL_LINKEDIN_OIDC_ENABLED',
  'EXTERNAL_NOTION_EMAIL_OPTIONAL',
  'EXTERNAL_NOTION_ENABLED',
  'EXTERNAL_SLACK_EMAIL_OPTIONAL',
  'EXTERNAL_SLACK_ENABLED',
  'EXTERNAL_SLACK_OIDC_EMAIL_OPTIONAL',
  'EXTERNAL_SLACK_OIDC_ENABLED',
  'EXTERNAL_SPOTIFY_EMAIL_OPTIONAL',
  'EXTERNAL_SPOTIFY_ENABLED',
  'EXTERNAL_TWITCH_EMAIL_OPTIONAL',
  'EXTERNAL_TWITCH_ENABLED',
  'EXTERNAL_TWITTER_EMAIL_OPTIONAL',
  'EXTERNAL_TWITTER_ENABLED',
  'EXTERNAL_WEB3_ETHEREUM_ENABLED',
  'EXTERNAL_WEB3_SOLANA_ENABLED',
  'EXTERNAL_WORKOS_ENABLED',
  'EXTERNAL_X_EMAIL_OPTIONAL',
  'EXTERNAL_X_ENABLED',
  'EXTERNAL_ZOOM_EMAIL_OPTIONAL',
  'EXTERNAL_ZOOM_ENABLED',
])

const NUMBER_FIELDS = new Set([
  'MAILER_OTP_LENGTH',
  'MAILER_OTP_EXP',
  'PASSWORD_MIN_LENGTH',
  'SMS_OTP_EXP',
  'SMS_OTP_LENGTH',
])

const STRING_FIELDS = new Set([
  'SMS_TEMPLATE',
  'SMS_TWILIO_ACCOUNT_SID',
  'SMS_TWILIO_MESSAGE_SERVICE_SID',
  'SMS_TWILIO_CONTENT_SID',
  'SMS_TWILIO_VERIFY_ACCOUNT_SID',
  'SMS_TWILIO_VERIFY_MESSAGE_SERVICE_SID',
  'SMS_MESSAGEBIRD_ORIGINATOR',
  'SMS_TEXTLOCAL_SENDER',
  'SMS_VONAGE_FROM',
  'EXTERNAL_APPLE_CLIENT_ID',
  'EXTERNAL_AZURE_CLIENT_ID',
  'EXTERNAL_AZURE_URL',
  'EXTERNAL_BITBUCKET_CLIENT_ID',
  'EXTERNAL_DISCORD_CLIENT_ID',
  'EXTERNAL_FACEBOOK_CLIENT_ID',
  'EXTERNAL_FIGMA_CLIENT_ID',
  'EXTERNAL_GITHUB_CLIENT_ID',
  'EXTERNAL_GITLAB_CLIENT_ID',
  'EXTERNAL_GITLAB_URL',
  'EXTERNAL_GOOGLE_CLIENT_ID',
  'EXTERNAL_KAKAO_CLIENT_ID',
  'EXTERNAL_KEYCLOAK_CLIENT_ID',
  'EXTERNAL_KEYCLOAK_URL',
  'EXTERNAL_LINKEDIN_OIDC_CLIENT_ID',
  'EXTERNAL_NOTION_CLIENT_ID',
  'EXTERNAL_SLACK_CLIENT_ID',
  'EXTERNAL_SLACK_OIDC_CLIENT_ID',
  'EXTERNAL_SPOTIFY_CLIENT_ID',
  'EXTERNAL_TWITCH_CLIENT_ID',
  'EXTERNAL_TWITTER_CLIENT_ID',
  'EXTERNAL_WORKOS_CLIENT_ID',
  'EXTERNAL_WORKOS_URL',
  'EXTERNAL_X_CLIENT_ID',
  'EXTERNAL_ZOOM_CLIENT_ID',
])

const SMS_PROVIDERS = new Set(['messagebird', 'textlocal', 'twilio', 'twilio_verify', 'vonage'])

const PASSWORD_REQUIREMENTS = new Set([
  '',
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
  'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
  'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789:!@#$%^&*()_+-=[]{};\'\\\\:"|<>?,./`~',
])

/**
 * Converts one confirmed, non-secret Auth drift field into the existing Management API payload.
 * GitHub config is repository-controlled input, so unsupported fields and invalid value types fail
 * closed instead of being cast into the API body.
 */
export function createAuthConfigRestorePayload(
  field: GitHubConfigDriftField
): AuthConfigRestorePayloadResult {
  const { fieldName, configPath, githubValue } = field

  if (SECRET_FIELD_PATTERN.test(fieldName) || configPath.split('.').includes('secret')) {
    return failure('Secret settings cannot be restored from config.toml.')
  }

  if (getAuthFieldConfigPath(fieldName) !== configPath) {
    return failure(`Unsupported Auth configuration path: ${configPath}`)
  }

  if (fieldName === 'SITE_URL') {
    if (typeof githubValue !== 'string' || githubValue.trim().length === 0) {
      return invalidType(fieldName, 'a non-empty string')
    }
    return success(fieldName, githubValue.trim())
  }

  if (fieldName === 'URI_ALLOW_LIST') {
    if (
      !Array.isArray(githubValue) ||
      !githubValue.every((value) => typeof value === 'string' && value.trim().length > 0)
    ) {
      return invalidType(fieldName, 'an array of non-empty strings')
    }

    const urls = Array.from(new Set(githubValue.map((value) => value.trim())))
    return success(fieldName, urls.join(','))
  }

  if (INVERSE_BOOLEAN_FIELDS.has(fieldName)) {
    if (typeof githubValue !== 'boolean') return invalidType(fieldName, 'a boolean')
    return success(fieldName, !githubValue)
  }

  if (fieldName === 'SMS_PROVIDER') {
    if (githubValue === '') return success(fieldName, null)
    if (typeof githubValue !== 'string' || !SMS_PROVIDERS.has(githubValue)) {
      return invalidType(fieldName, 'a supported SMS provider')
    }
    return success(fieldName, githubValue)
  }

  if (fieldName === 'PASSWORD_REQUIRED_CHARACTERS') {
    if (typeof githubValue !== 'string' || !PASSWORD_REQUIREMENTS.has(githubValue)) {
      return invalidType(fieldName, 'a supported password requirement')
    }
    return success(fieldName, githubValue)
  }

  if (BOOLEAN_FIELDS.has(fieldName)) {
    if (typeof githubValue !== 'boolean') return invalidType(fieldName, 'a boolean')
    return success(fieldName, githubValue)
  }

  if (NUMBER_FIELDS.has(fieldName)) {
    if (typeof githubValue !== 'number' || !Number.isFinite(githubValue)) {
      return invalidType(fieldName, 'a finite number')
    }
    return success(fieldName, githubValue)
  }

  if (STRING_FIELDS.has(fieldName)) {
    if (typeof githubValue !== 'string') return invalidType(fieldName, 'a string')
    return success(fieldName, githubValue === '' ? null : githubValue)
  }

  return failure(`Unsupported Auth setting: ${fieldName}`)
}

/**
 * Builds one Management API patch for the complete drift set. Every field is
 * validated before the caller sends the request, so an unsupported value can
 * never result in a partial restore.
 */
export function createAuthConfigRestorePayloads(
  fields: readonly GitHubConfigDriftField[]
): AuthConfigRestorePayloadResult {
  if (fields.length === 0) return failure('There are no configuration differences to restore.')

  const payload: AuthConfigRestorePayload = {}
  for (const field of fields) {
    const result = createAuthConfigRestorePayload(field)
    if (!result.ok) return result
    Object.assign(payload, result.payload)
  }

  return { ok: true, payload }
}

function success(fieldName: string, value: unknown): AuthConfigRestorePayloadResult {
  return {
    ok: true,
    payload: { [fieldName]: value } as AuthConfigRestorePayload,
  }
}

function invalidType(fieldName: string, expected: string): AuthConfigRestorePayloadResult {
  return failure(`config.toml value for ${fieldName} must be ${expected}.`)
}

function failure(error: string): AuthConfigRestorePayloadResult {
  return { ok: false, error }
}
