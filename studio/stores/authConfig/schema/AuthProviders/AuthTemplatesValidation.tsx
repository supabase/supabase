import { FormSchema } from 'types'
import { object, string } from 'yup'

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#'

export const CONFIRMATION: FormSchema = {
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
- \`{{ .ConfirmationURL }}\` : URL to confirm the message
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
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

export const INVITE: FormSchema = {
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
- \`{{ .ConfirmationURL }}\` : URL to confirm the message
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
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

export const MAGIC_LINK: FormSchema = {
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
- \`{{ .ConfirmationURL }}\` : URL to confirm the message
- \`{{ .Token }}\` : The 6-digit numeric email OTP 
- \`{{ .TokenHash }}\` : The hashed token used in the URL
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

export const EMAIL_CHANGE: FormSchema = {
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

export const RECOVERY: FormSchema = {
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

export const TEMPLATES_SCHEMAS = [CONFIRMATION, INVITE, MAGIC_LINK, EMAIL_CHANGE, RECOVERY]
