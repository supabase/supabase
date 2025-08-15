import z from 'zod'

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#' as const

export interface Template {
  $schema: typeof JSON_SCHEMA_VERSION
  type: 'object'
  id: string
  title: string
  properties: Record<
    string,
    {
      title: string
      type: 'string' | 'code'
      description?: string
      descriptionOptional?: string
    }
  >
  validationSchema: ((smsEnabled: boolean) => z.ZodSchema) | z.ZodSchema
  misc: {
    iconKey: string
    helper?: string
  }
}

const CONFIRMATION = {
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
  validationSchema: z.object({
    MAILER_SUBJECTS_CONFIRMATION: z.string({
      required_error: '"Subject heading is required.',
    }),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
} as const satisfies Template

const INVITE = {
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
  validationSchema: z.object({
    MAILER_SUBJECTS_INVITE: z.string({ required_error: '"Subject heading is required.' }),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
} as const satisfies Template

const MAGIC_LINK = {
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
  validationSchema: z.object({
    MAILER_SUBJECTS_MAGIC_LINK: z.string({ required_error: '"Subject heading is required.' }),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
} as const satisfies Template

const EMAIL_CHANGE = {
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
  validationSchema: z.object({
    MAILER_SUBJECTS_EMAIL_CHANGE: z.string({ required_error: '"Subject heading is required.' }),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
} as const satisfies Template

const RECOVERY = {
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
  validationSchema: z.object({
    MAILER_SUBJECTS_RECOVERY: z.string({ required_error: '"Subject heading is required.' }),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
} as const satisfies Template

const REAUTHENTICATION = {
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
  validationSchema: z.object({
    MAILER_SUBJECTS_REAUTHENTICATION: z.string({ required_error: '"Subject heading is required.' }),
  }),
  misc: {
    iconKey: 'email-icon2',
    helper: `To complete setup, add this authorisation callback URL to your app's configuration in the Apple Developer Console.
            [Learn more](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)`,
  },
} as const satisfies Template

export const TEMPLATES_SCHEMAS = [
  CONFIRMATION,
  INVITE,
  MAGIC_LINK,
  EMAIL_CHANGE,
  RECOVERY,
  REAUTHENTICATION,
] as const
