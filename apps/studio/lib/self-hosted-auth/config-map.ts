export const configEnvMap: Record<string, string> = {
  // Basic Config
  site_url: 'SITE_URL',
  uri_allow_list: 'ADDITIONAL_REDIRECT_URLS',
  disable_signup: 'DISABLE_SIGNUP',
  jwt_exp: 'JWT_EXPIRY',
  external_email_enabled: 'ENABLE_EMAIL_SIGNUP',
  mailer_autoconfirm: 'ENABLE_EMAIL_AUTOCONFIRM',
  external_phone_enabled: 'ENABLE_PHONE_SIGNUP',
  sms_autoconfirm: 'ENABLE_PHONE_AUTOCONFIRM',
  external_anonymous_users_enabled: 'ENABLE_ANONYMOUS_USERS',

  // SMTP
  smtp_admin_email: 'SMTP_ADMIN_EMAIL',
  smtp_host: 'SMTP_HOST',
  smtp_port: 'SMTP_PORT',
  smtp_user: 'SMTP_USER',
  smtp_pass: 'SMTP_PASS',
  smtp_sender_name: 'SMTP_SENDER_NAME',

  // Mailer Paths
  mailer_urlpaths_invite: 'MAILER_URLPATHS_INVITE',
  mailer_urlpaths_confirmation: 'MAILER_URLPATHS_CONFIRMATION',
  mailer_urlpaths_recovery: 'MAILER_URLPATHS_RECOVERY',
  mailer_urlpaths_email_change: 'MAILER_URLPATHS_EMAIL_CHANGE',

  // Google
  external_google_enabled: 'GOOGLE_ENABLED',
  external_google_client_id: 'GOOGLE_CLIENT_ID',
  external_google_secret: 'GOOGLE_SECRET',

  // GitHub
  external_github_enabled: 'GITHUB_ENABLED',
  external_github_client_id: 'GITHUB_CLIENT_ID',
  external_github_secret: 'GITHUB_SECRET',

  // Azure
  external_azure_enabled: 'AZURE_ENABLED',
  external_azure_client_id: 'AZURE_CLIENT_ID',
  external_azure_secret: 'AZURE_SECRET',

  // MFA
  mfa_totp_enroll_enabled: 'MFA_TOTP_ENROLL_ENABLED',
  mfa_totp_verify_enabled: 'MFA_TOTP_VERIFY_ENABLED',
  mfa_phone_enroll_enabled: 'MFA_PHONE_ENROLL_ENABLED',
  mfa_phone_verify_enabled: 'MFA_PHONE_VERIFY_ENABLED',
  mfa_max_enrolled_factors: 'MFA_MAX_ENROLLED_FACTORS',

  // Hooks
  hook_custom_access_token_enabled: 'HOOK_CUSTOM_ACCESS_TOKEN_ENABLED',
  hook_custom_access_token_uri: 'HOOK_CUSTOM_ACCESS_TOKEN_URI',
  hook_custom_access_token_secrets: 'HOOK_CUSTOM_ACCESS_TOKEN_SECRETS',

  hook_mfa_verification_attempt_enabled: 'HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED',
  hook_mfa_verification_attempt_uri: 'HOOK_MFA_VERIFICATION_ATTEMPT_URI',

  hook_password_verification_attempt_enabled: 'HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED',
  hook_password_verification_attempt_uri: 'HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI',
}

// Map GoTrue env names back to Studio config field names
export const envConfigMap: Record<string, string> = Object.entries(configEnvMap).reduce(
  (acc, [configField, envVar]) => {
    acc[envVar] = configField
    return acc
  },
  {} as Record<string, string>
)
