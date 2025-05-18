import type { components } from 'data/api'

type AuthConfig = components['schemas']['GoTrueConfigResponse']

interface AuthConfigForm extends AuthConfig {
  ENABLE_SMTP: boolean
}

export const isSmtpEnabled = (config?: Partial<AuthConfig>): boolean => {
  return !!(
    config?.SMTP_ADMIN_EMAIL &&
    config?.SMTP_SENDER_NAME &&
    config?.SMTP_USER &&
    config?.SMTP_HOST &&
    config?.SMTP_PORT &&
    (config?.SMTP_MAX_FREQUENCY ?? 0) >= 0
  )
}

export const generateFormValues = (config?: Partial<AuthConfig>): Partial<AuthConfigForm> => {
  return {
    ENABLE_SMTP: isSmtpEnabled(config),
    SMTP_ADMIN_EMAIL: config?.SMTP_ADMIN_EMAIL ?? '',
    SMTP_SENDER_NAME: config?.SMTP_SENDER_NAME ?? '',
    SMTP_USER: config?.SMTP_USER ?? '',
    SMTP_HOST: config?.SMTP_HOST ?? '',
    SMTP_PASS: '',
    SMTP_PORT: config?.SMTP_PORT ?? '465',
    SMTP_MAX_FREQUENCY: config?.SMTP_MAX_FREQUENCY ?? 60,
    RATE_LIMIT_EMAIL_SENT: config?.RATE_LIMIT_EMAIL_SENT ?? 30,
  }
}
