import { AUTH_CONFIG_KEYS } from './auth-config-keys.js'
import type { ConfigValue } from './store.js'

const KNOWN_DEFAULTS: Record<string, ConfigValue> = {
  CUSTOM_OAUTH_ENABLED: true,
  CUSTOM_OAUTH_MAX_PROVIDERS: 0,
  EXTERNAL_EMAIL_ENABLED: true,
  JWT_EXP: 3600,
  MAILER_OTP_EXP: 86400,
  MAILER_OTP_LENGTH: 6,
  MFA_MAX_ENROLLED_FACTORS: 10,
  MFA_TOTP_ENROLL_ENABLED: true,
  MFA_TOTP_VERIFY_ENABLED: true,
  PASSWORD_MIN_LENGTH: 6,
  RATE_LIMIT_ANONYMOUS_USERS: 30,
  RATE_LIMIT_EMAIL_SENT: 30,
  RATE_LIMIT_OTP: 30,
  RATE_LIMIT_SMS_SENT: 30,
  RATE_LIMIT_TOKEN_REFRESH: 150,
  RATE_LIMIT_VERIFY: 30,
  RATE_LIMIT_WEB3: 30,
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10,
  SESSIONS_SINGLE_PER_USER: false,
  SITE_URL: 'http://localhost:3000',
  SMS_MAX_FREQUENCY: 60,
  SMS_OTP_EXP: 60,
  SMS_OTP_LENGTH: 6,
  SMS_PROVIDER: 'twilio',
  SMS_TEMPLATE: 'Your code is {{ .Code }}',
  SMTP_MAX_FREQUENCY: 60,
  SMTP_PORT: '587',
  MAILER_SUBJECTS_CONFIRMATION: 'Confirm Your Signup',
  MAILER_SUBJECTS_INVITE: 'You have been invited',
  MAILER_SUBJECTS_MAGIC_LINK: 'Your Magic Link',
  MAILER_SUBJECTS_EMAIL_CHANGE: 'Confirm Email Change',
  MAILER_SUBJECTS_RECOVERY: 'Reset Your Password',
  MAILER_SUBJECTS_REAUTHENTICATION: 'Confirm Reauthentication',
  MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: 'Your password has been changed',
  MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: 'Your email address has been changed',
  MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: 'Your phone number has been changed',
  MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: 'A new identity has been linked',
  MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: 'An identity has been unlinked',
  MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: 'A new MFA factor has been enrolled',
  MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION: 'An MFA factor has been unenrolled',
  MAILER_TEMPLATES_CONFIRMATION_CONTENT: `<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
`,
  MAILER_TEMPLATES_INVITE_CONTENT: `<h2>You have been invited</h2>

<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>
<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
`,
  MAILER_TEMPLATES_MAGIC_LINK_CONTENT: `<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
`,
  MAILER_TEMPLATES_EMAIL_CHANGE_CONTENT: `<h2>Confirm Change of Email</h2>

<p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>
<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>
`,
  MAILER_TEMPLATES_RECOVERY_CONTENT: `<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
`,
  MAILER_TEMPLATES_REAUTHENTICATION_CONTENT: `<h2>Confirm reauthentication</h2>

<p>Enter the code: {{ .Token }}</p>
`,
  MAILER_TEMPLATES_PASSWORD_CHANGED_NOTIFICATION_CONTENT: `<h2>Your password has been changed</h2>

<p>This is a confirmation that the password for your account {{ .Email }} has just been changed.</p>
<p>If you did not make this change, please contact support.</p>
`,
  MAILER_TEMPLATES_EMAIL_CHANGED_NOTIFICATION_CONTENT: `<h2>Your email address has been changed</h2>

<p>The email address for your account has been changed from {{ .OldEmail }} to {{ .Email }}.</p>
<p>If you did not make this change, please contact support.</p>
`,
  MAILER_TEMPLATES_PHONE_CHANGED_NOTIFICATION_CONTENT: `<h2>Your phone number has been changed</h2>

<p>The phone number for your account {{ .Email }} has been changed from {{ .OldPhone }} to {{ .Phone }}.</p>
<p>If you did not make this change, please contact support immediately.</p>
`,
  MAILER_TEMPLATES_IDENTITY_LINKED_NOTIFICATION_CONTENT: `<h2>A new identity has been linked</h2>

<p>A new identity ({{ .Provider }}) has been linked to your account {{ .Email }}.</p>
<p>If you did not make this change, please contact support immediately.</p>
`,
  MAILER_TEMPLATES_IDENTITY_UNLINKED_NOTIFICATION_CONTENT: `<h2>An identity has been unlinked</h2>

<p>An identity ({{ .Provider }}) has been unlinked from your account {{ .Email }}.</p>
<p>If you did not make this change, please contact support immediately.</p>
`,
  MAILER_TEMPLATES_MFA_FACTOR_ENROLLED_NOTIFICATION_CONTENT: `<h2>A new MFA factor has been enrolled</h2>

<p>A new factor ({{ .FactorType }}) has been enrolled for your account {{ .Email }}.</p>
<p>If you did not make this change, please contact support immediately.</p>
`,
  MAILER_TEMPLATES_MFA_FACTOR_UNENROLLED_NOTIFICATION_CONTENT: `<h2>An MFA factor has been unenrolled</h2>

<p>A factor ({{ .FactorType }}) has been unenrolled for your account {{ .Email }}.</p>
<p>If you did not make this change, please contact support immediately.</p>
`,
}

export function defaultAuthConfig(): Record<string, ConfigValue> {
  const out: Record<string, ConfigValue> = {}
  for (const [key, type] of Object.entries(AUTH_CONFIG_KEYS)) {
    if (type === 'boolean') out[key] = false
    else if (type === 'number') out[key] = 0
    else out[key] = ''
  }
  return { ...out, ...KNOWN_DEFAULTS }
}
