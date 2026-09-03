import type { ConfigValue } from './store.js'

const BOOLEAN_KEYS = [
  'DISABLE_SIGNUP',
  'EXTERNAL_EMAIL_ENABLED',
  'EXTERNAL_ANONYMOUS_USERS_ENABLED',
  'EXTERNAL_PHONE_ENABLED',
  'MAILER_AUTOCONFIRM',
  'SMS_AUTOCONFIRM',
]

const NUMBER_KEYS = ['JWT_EXP']

const STRING_KEYS = [
  'SITE_URL',
  'URI_ALLOW_LIST',
  'SMTP_ADMIN_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_SENDER_NAME',
]

export function baselineConfig(): Record<string, ConfigValue> {
  const out: Record<string, ConfigValue> = {}
  for (const key of STRING_KEYS) {
    const value = process.env[`AUTH_DEFAULT_${key}`]
    if (value !== undefined) out[key] = value
  }
  for (const key of BOOLEAN_KEYS) {
    const value = process.env[`AUTH_DEFAULT_${key}`]
    if (value !== undefined) out[key] = value === 'true'
  }
  for (const key of NUMBER_KEYS) {
    const value = process.env[`AUTH_DEFAULT_${key}`]
    if (value !== undefined && !Number.isNaN(Number(value))) out[key] = Number(value)
  }
  return out
}
