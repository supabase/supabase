import { object, string } from 'yup'
import type { FormSchema } from 'types'

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#'

const CONFIRMATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'CONFIRMATION',
  type: 'object',
  title: 'Confirm sign up',
  purpose: 'Email verification for new user registrations',
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
- \`{{ .ConfirmationURL }}\` : URL to confirm the email address for the new account
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
    MAILER_SUBJECTS_CONFIRMATION: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const INVITE: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'INVITE',
  type: 'object',
  title: 'Invite user',
  purpose: "Allows administrators to invite users who don't have accounts yet",
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
    MAILER_SUBJECTS_INVITE: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const MAGIC_LINK: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MAGIC_LINK',
  type: 'object',
  title: 'Magic link',
  purpose: 'Passwordless login using email links',
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
    MAILER_SUBJECTS_MAGIC_LINK: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const EMAIL_CHANGE: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'EMAIL_CHANGE',
  type: 'object',
  title: 'Change email address',
  purpose: 'Verification for email address changes',
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
    MAILER_SUBJECTS_EMAIL_CHANGE: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const RECOVERY: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'RECOVERY',
  type: 'object',
  title: 'Reset password',
  purpose: 'Password recovery flow for users who forgot their password',
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
    MAILER_SUBJECTS_RECOVERY: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}
const REAUTHENTICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'REAUTHENTICATION',
  type: 'object',
  title: 'Reauthentication',
  purpose:
    'Additional verification for sensitive actions (like changing password, deleting account)',
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
    MAILER_SUBJECTS_REAUTHENTICATION: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

// Notifications
const PASSWORD_CHANGED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'PASSWORD_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Password changed notification',
  purpose: 'Notify a user when their password has been changed',
  properties: {
    MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_PASSWORD_CHANGED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: string().required(
      'Subject heading is required.'
    ),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const EMAIL_CHANGED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'EMAIL_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Email changed notification',
  purpose: 'Notify a user when their email address has been changed',
  properties: {
    MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_EMAIL_CHANGED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's new email address
- \`{{ .OldEmail }}\` : The user's old email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const PHONE_CHANGED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'PHONE_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Phone changed notification',
  purpose: 'Notify a user when the phone number has been changed',
  properties: {
    MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_PHONE_CHANGED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's email address
- \`{{ .Phone }}\` : The user's new phone number
- \`{{ .OldPhone }}\` : The user's old phone number
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const IDENTITY_LINKED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'IDENTITY_LINKED_NOTIFICATION',
  type: 'object',
  title: 'Identity linked notification',
  purpose: 'Notify a user when a new identity has been linked to their account',
  properties: {
    MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_IDENTITY_LINKED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's email address
- \`{{ .Provider }}\` : The provider of the newly linked identity
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: string().required('Subject heading is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const IDENTITY_UNLINKED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'IDENTITY_UNLINKED_NOTIFICATION',
  type: 'object',
  title: 'Identity unlinked notification',
  purpose: 'Notify a user when an identity has been unlinked from their account',
  properties: {
    MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_IDENTITY_UNLINKED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's email address
- \`{{ .Provider }}\` : The provider of the unlinked identity
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: string().required(
      'Subject heading is required.'
    ),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const MFA_FACTOR_ENROLLED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MFA_FACTOR_ENROLLED_NOTIFICATION',
  type: 'object',
  title: 'MFA factor enrolled notification',
  purpose: 'Notify a user when a new MFA factor has been enrolled for their account',
  properties: {
    MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_MFA_FACTOR_ENROLLED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's email address
- \`{{ .FactorType }}\` : The type of the newly enrolled MFA factor
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: string().required(
      'Subject heading is required.'
    ),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const MFA_FACTOR_UNENROLLED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MFA_FACTOR_UNENROLLED_NOTIFICATION',
  type: 'object',
  title: 'MFA factor unenrolled notification',
  purpose: 'Notify a user when an MFA factor has been unenrolled from their account',
  properties: {
    MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION: {
      title: 'Subject heading',
      type: 'string',
    },
    MAILER_TEMPLATES_MFA_FACTOR_UNENROLLED_NOTIFICATION_CONTENT: {
      title: 'Message body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: ` 
- \`{{ .Email }}\` : The user's email address
- \`{{ .FactorType }}\` : The type of the newly enrolled MFA factor
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: object().shape({
    MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION: string().required(
      'Subject heading is required.'
    ),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

export const TEMPLATES_SCHEMAS = [
  CONFIRMATION,
  INVITE,
  MAGIC_LINK,
  EMAIL_CHANGE,
  RECOVERY,
  REAUTHENTICATION,
  // Notifications
  PASSWORD_CHANGED_NOTIFICATION,
  EMAIL_CHANGED_NOTIFICATION,
  PHONE_CHANGED_NOTIFICATION,
  IDENTITY_LINKED_NOTIFICATION,
  IDENTITY_UNLINKED_NOTIFICATION,
  MFA_FACTOR_ENROLLED_NOTIFICATION,
  MFA_FACTOR_UNENROLLED_NOTIFICATION,
]
