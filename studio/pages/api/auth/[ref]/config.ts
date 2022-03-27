import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform only API
  return res.status(200).json({
    app_version: '',
    config_override_id: '',
    project_id: '',
    jwt_secret_encrypted: '',
    isFreeTier: true,
    SITE_URL: '',
    OPERATOR_TOKEN: null,
    DISABLE_SIGNUP: false,
    RATE_LIMIT_HEADER: null,
    JWT_EXP: 3600,
    JWT_AUD: '',
    JWT_DEFAULT_GROUP_NAME: '',
    URI_ALLOW_LIST: '',
    MAILER_AUTOCONFIRM: false,
    MAILER_URLPATHS_INVITE: '',
    MAILER_URLPATHS_CONFIRMATION: '',
    MAILER_URLPATHS_RECOVERY: '',
    MAILER_URLPATHS_EMAIL_CHANGE: '',
    SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION: false,
    SMTP_ADMIN_EMAIL: '',
    SMTP_HOST: null,
    SMTP_PORT: null,
    SMTP_USER: null,
    SMTP_PASS: null,
    SMTP_MAX_FREQUENCY: 0,
    EXTERNAL_EMAIL_ENABLED: true,
    EXTERNAL_PHONE_ENABLED: true,
    EXTERNAL_APPLE_ENABLED: false,
    EXTERNAL_APPLE_CLIENT_ID: null,
    EXTERNAL_APPLE_SECRET: null,
    EXTERNAL_AZURE_ENABLED: false,
    EXTERNAL_AZURE_CLIENT_ID: null,
    EXTERNAL_AZURE_SECRET: null,
    EXTERNAL_AZURE_URL: null,
    EXTERNAL_BITBUCKET_ENABLED: false,
    EXTERNAL_BITBUCKET_CLIENT_ID: null,
    EXTERNAL_BITBUCKET_SECRET: null,
    EXTERNAL_DISCORD_ENABLED: false,
    EXTERNAL_DISCORD_CLIENT_ID: null,
    EXTERNAL_DISCORD_SECRET: null,
    EXTERNAL_FACEBOOK_ENABLED: false,
    EXTERNAL_FACEBOOK_CLIENT_ID: null,
    EXTERNAL_FACEBOOK_SECRET: null,
    EXTERNAL_GITHUB_ENABLED: false,
    EXTERNAL_GITHUB_CLIENT_ID: null,
    EXTERNAL_GITHUB_SECRET: null,
    EXTERNAL_GITLAB_ENABLED: false,
    EXTERNAL_GITLAB_CLIENT_ID: null,
    EXTERNAL_GITLAB_SECRET: null,
    EXTERNAL_GITLAB_REDIRECT_URI: null,
    EXTERNAL_GOOGLE_ENABLED: false,
    EXTERNAL_GOOGLE_CLIENT_ID: null,
    EXTERNAL_GOOGLE_SECRET: null,
    EXTERNAL_LINKEDIN_ENABLED: false,
    EXTERNAL_LINKEDIN_CLIENT_ID: null,
    EXTERNAL_LINKEDIN_SECRET: null,
    EXTERNAL_NOTION_ENABLED: false,
    EXTERNAL_NOTION_CLIENT_ID: null,
    EXTERNAL_NOTION_SECRET: null,
    EXTERNAL_SPOTIFY_ENABLED: false,
    EXTERNAL_SPOTIFY_CLIENT_ID: null,
    EXTERNAL_SPOTIFY_SECRET: null,
    EXTERNAL_SLACK_ENABLED: false,
    EXTERNAL_SLACK_CLIENT_ID: null,
    EXTERNAL_SLACK_SECRET: null,
    EXTERNAL_TWITTER_ENABLED: false,
    EXTERNAL_TWITTER_CLIENT_ID: null,
    EXTERNAL_TWITTER_SECRET: null,
    EXTERNAL_TWITCH_ENABLED: false,
    EXTERNAL_TWITCH_CLIENT_ID: null,
    EXTERNAL_TWITCH_SECRET: null,
    EXTERNAL_ZOOM_ENABLED: false,
    EXTERNAL_ZOOM_CLIENT_ID: null,
    EXTERNAL_ZOOM_SECRET: null,
    MAILER_SUBJECTS_INVITE: 'You have been invited',
    MAILER_SUBJECTS_CONFIRMATION: 'Confirm Your Signup',
    MAILER_SUBJECTS_RECOVERY: 'Reset Your Password',
    MAILER_SUBJECTS_EMAIL_CHANGE: 'Confirm Email Change',
    MAILER_SUBJECTS_MAGIC_LINK: 'Your Magic Link',
    MAILER_TEMPLATES_INVITE: null,
    MAILER_TEMPLATES_INVITE_CONTENT:
      '<h2>You have been invited</h2>\n\n<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>\n<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>',
    MAILER_TEMPLATES_CONFIRMATION: null,
    MAILER_TEMPLATES_CONFIRMATION_CONTENT:
      '<h2>Confirm your signup</h2>\n\n<p>Follow this link to confirm your user:</p>\n<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>',
    MAILER_TEMPLATES_RECOVERY: null,
    MAILER_TEMPLATES_RECOVERY_CONTENT:
      '<h2>Reset Password</h2>\n\n<p>Follow this link to reset the password for your user:</p>\n<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>',
    MAILER_TEMPLATES_EMAIL_CHANGE: null,
    MAILER_TEMPLATES_EMAIL_CHANGE_CONTENT:
      '<h2>Confirm Change of Email</h2>\n\n<p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>\n<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>',
    MAILER_TEMPLATES_MAGIC_LINK: null,
    MAILER_TEMPLATES_MAGIC_LINK_CONTENT:
      '<h2>Magic Link</h2>\n\n<p>Follow this link to login:</p>\n<p><a href="{{ .ConfirmationURL }}">Log In</a></p>',
    PASSWORD_MIN_LENGTH: 6,
    SMTP_SENDER_NAME: null,
    SMS_AUTOCONFIRM: false,
    SMS_MAX_FREQUENCY: 0,
    SMS_OTP_EXP: 0,
    SMS_OTP_LENGTH: 0,
    SMS_PROVIDER: 'twilio',
    SMS_TWILIO_ACCOUNT_SID: null,
    SMS_TWILIO_AUTH_TOKEN: null,
    SMS_TWILIO_MESSAGE_SERVICE_SID: null,
    SMS_TEMPLATE: 'Your code is {{ .Code }}',
    SECURITY_CAPTCHA_ENABLED: false,
    SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
    SECURITY_CAPTCHA_SECRET: null,
    RATE_LIMIT_EMAIL_SENT: 0,
    MAILER_SECURE_EMAIL_CHANGE_ENABLED: true,
    SMS_MESSAGEBIRD_ACCESS_KEY: null,
    SMS_MESSAGEBIRD_ORIGINATOR: null,
    SMS_VONAGE_API_KEY: null,
    SMS_VONAGE_API_SECRET: null,
    SMS_VONAGE_FROM: null,
    SMS_TEXTLOCAL_API_KEY: null,
    SMS_TEXTLOCAL_SENDER: null,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform only API
  return res.status(200).json({})
}
