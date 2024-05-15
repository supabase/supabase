import type { FormSchema } from 'types'
import { object, string } from 'yup'

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#'

const CONFIRMATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'CONFIRMATION',
  type: 'object',
  title: 'Confirm signup',
  properties: {
    MAILER_SUBJECTS_CONFIRMATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_CONFIRMATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .ConfirmationURL }}\` : URL to confirm the e-mail address for the new account
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
- \`{{ .SiteURL }}\` : The URL of the site
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
- \`{{ .RedirectTo }}\` : The URL of \`emailRedirectTo\` passed in options
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_CONFIRMATION: string().required('"Subject heading is required.'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const INVITE: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'INVITE',
  type: 'object',
  title: 'Invite user',
  properties: {
    MAILER_SUBJECTS_INVITE: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_INVITE_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .ConfirmationURL }}\` : URL to accept the invitation to create an account
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
- \`{{ .SiteURL }}\` : The URL of the site
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
- \`{{ .RedirectTo }}\` : The URL of \`redirectTo\` passed in options
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_INVITE: string().required('"Subject heading is required.'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const MAGIC_LINK: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MAGIC_LINK',
  type: 'object',
  title: 'Magic Link',
  properties: {
    MAILER_SUBJECTS_MAGIC_LINK: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_MAGIC_LINK_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .ConfirmationURL }}\` : URL for a one-time login to the user's account
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
- \`{{ .SiteURL }}\` : The URL of the site
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
- \`{{ .RedirectTo }}\` : The URL of \`emailRedirectTo\` passed in options
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_MAGIC_LINK: string().required('"Subject heading is required.'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const EMAIL_CHANGE: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'EMAIL_CHANGE',
  type: 'object',
  title: 'Change Email Address',
  properties: {
    MAILER_SUBJECTS_EMAIL_CHANGE: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_EMAIL_CHANGE_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .ConfirmationURL }}\` : URL to confirm the email change
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
- \`{{ .SiteURL }}\` : The URL of the site
- \`{{ .Email }}\` : The original user's email address
- \`{{ .NewEmail }}\` : The user's new email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
- \`{{ .RedirectTo }}\` : The URL of \`emailRedirectTo\` passed in options
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_EMAIL_CHANGE: string().required('"Subject heading is required.'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

const RECOVERY: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'RECOVERY',
  type: 'object',
  title: 'Reset Password',
  properties: {
    MAILER_SUBJECTS_RECOVERY: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_RECOVERY_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .ConfirmationURL }}\` : URL to confirm the password reset
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
- \`{{ .SiteURL }}\` : The URL of the site
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
- \`{{ .RedirectTo }}\` : The URL of \`redirectTo\` passed in options
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_RECOVERY: string().required('"Subject heading is required.'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}
const REAUTHENTICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'REAUTHENTICATION',
  type: 'object',
  title: 'Reauthentication',
  properties: {
    MAILER_SUBJECTS_REAUTHENTICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_REAUTHENTICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Token }}\` : The 6-digit numeric email OTP
- \`{{ .SiteURL }}\` : The URL of the site
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_REAUTHENTICATION: string().required('"Subject heading is required.'),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
}

export const TEMPLATES_SCHEMAS = [
  CONFIRMATION,
  INVITE,
  MAGIC_LINK,
  EMAIL_CHANGE,
  RECOVERY,
  REAUTHENTICATION,
]
