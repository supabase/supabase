import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextApiRequest, NextApiResponse } from 'next'

import { consoleGet } from '@/lib/console-bff'

// [console fork] Persist the user's auth-config overrides so toggles stick across
// reloads (GoTrue's runtime config isn't a platform DB here). Stored per-project.
const CONFIG_DIR = join(process.cwd(), '.auth-config')
const overridesPath = (ref: string) => join(CONFIG_DIR, `${ref}.json`)

function readOverrides(ref: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(overridesPath(ref), 'utf8'))
  } catch {
    return {}
  }
}

function writeOverrides(ref: string, overrides: Record<string, unknown>) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(overridesPath(ref), JSON.stringify(overrides, null, 2), 'utf8')
}

// [console fork] GET/PATCH the project's GoTrue auth config for the Authentication
// settings pages. Supabase stores this in its platform DB; we don't, so we return a
// sensible self-host default (derived where possible from the project) so every Auth
// settings sub-page renders. PATCH is accepted and echoed back (config is governed by
// the project's GoTrue env on shared infra).
const defaultConfig = (siteUrl: string) => ({
  SITE_URL: siteUrl,
  URI_ALLOW_LIST: '',
  DISABLE_SIGNUP: false,
  JWT_EXP: 3600,
  REFRESH_TOKEN_ROTATION_ENABLED: true,
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10,
  SECURITY_CAPTCHA_ENABLED: false,
  SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
  SECURITY_CAPTCHA_SECRET: '',
  SECURITY_MANUAL_LINKING_ENABLED: false,
  SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION: false,
  SESSIONS_TIMEBOX: 0,
  SESSIONS_INACTIVITY_TIMEOUT: 0,
  SESSIONS_SINGLE_PER_USER: false,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_REQUIRED_CHARACTERS: '',
  PASSWORD_HIBP_ENABLED: false,
  RATE_LIMIT_EMAIL_SENT: 30,
  RATE_LIMIT_SMS_SENT: 30,
  RATE_LIMIT_VERIFY: 30,
  RATE_LIMIT_TOKEN_REFRESH: 150,
  RATE_LIMIT_OTP: 30,
  RATE_LIMIT_ANONYMOUS_USERS: 30,

  // Email / mailer
  EXTERNAL_EMAIL_ENABLED: true,
  MAILER_AUTOCONFIRM: true,
  MAILER_OTP_EXP: 3600,
  MAILER_OTP_LENGTH: 6,
  MAILER_SECURE_EMAIL_CHANGE_ENABLED: true,
  SMTP_ADMIN_EMAIL: '',
  SMTP_HOST: '',
  SMTP_PORT: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_SENDER_NAME: '',
  SMTP_MAX_FREQUENCY: 60,

  // Phone
  EXTERNAL_PHONE_ENABLED: false,
  SMS_AUTOCONFIRM: false,
  SMS_OTP_EXP: 60,
  SMS_OTP_LENGTH: 6,
  SMS_PROVIDER: 'twilio',

  // Anonymous
  EXTERNAL_ANONYMOUS_USERS_ENABLED: false,

  // MFA
  MFA_MAX_ENROLLED_FACTORS: 10,
  MFA_TOTP_ENROLL_ENABLED: true,
  MFA_TOTP_VERIFY_ENABLED: true,
  MFA_PHONE_ENROLL_ENABLED: false,
  MFA_PHONE_VERIFY_ENABLED: false,
  MFA_WEB_AUTHN_ENROLL_ENABLED: false,
  MFA_WEB_AUTHN_VERIFY_ENABLED: false,

  // Hooks
  HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: false,
  HOOK_SEND_SMS_ENABLED: false,
  HOOK_SEND_EMAIL_ENABLED: false,
  HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED: false,
  HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED: false,

  // OAuth providers — all disabled by default on self-host
  ...Object.fromEntries(
    [
      'APPLE', 'AZURE', 'BITBUCKET', 'DISCORD', 'FACEBOOK', 'FIGMA', 'GITHUB', 'GITLAB',
      'GOOGLE', 'KAKAO', 'KEYCLOAK', 'LINKEDIN_OIDC', 'NOTION', 'TWITCH', 'TWITTER',
      'SLACK_OIDC', 'SPOTIFY', 'WORKOS', 'ZOOM',
    ].flatMap((p) => [
      [`EXTERNAL_${p}_ENABLED`, false],
      [`EXTERNAL_${p}_CLIENT_ID`, ''],
      [`EXTERNAL_${p}_SECRET`, ''],
    ])
  ),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  let siteUrl = 'http://localhost:8082'
  try {
    const { data: project } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    siteUrl = project?.connection?.apiUrl ?? siteUrl
  } catch {
    /* fall back to default */
  }

  if (req.method === 'GET') {
    // defaults <- persisted overrides, so saved toggles survive reloads.
    return res.status(200).json({ ...defaultConfig(siteUrl), ...readOverrides(ref) })
  }
  if (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'POST') {
    const merged = { ...readOverrides(ref), ...(req.body ?? {}) }
    writeOverrides(ref, merged)
    return res.status(200).json({ ...defaultConfig(siteUrl), ...merged })
  }
  res.setHeader('Allow', ['GET', 'PATCH'])
  return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
}
