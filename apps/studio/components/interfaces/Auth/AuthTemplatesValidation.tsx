import * as z from 'zod'

import type { FormSchema } from '@/types'

const JSON_SCHEMA_VERSION = 'http://json-schema.org/draft-07/schema#'

const CONFIRMATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'CONFIRMATION',
  type: 'object',
  title: 'Confirm sign up',
  purpose: 'Ask users to confirm their email address after signing up',
  properties: {
    MAILER_SUBJECTS_CONFIRMATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_CONFIRMATION_CONTENT: {
      title: 'Body',
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
  validationSchema: z.object({
    MAILER_SUBJECTS_CONFIRMATION: z.string().min(1, 'Subject is required.'),
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
  purpose: 'Invite someone to create an account',
  properties: {
    MAILER_SUBJECTS_INVITE: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_INVITE_CONTENT: {
      title: 'Body',
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
    MAILER_SUBJECTS_INVITE: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const MAGIC_LINK: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MAGIC_LINK',
  type: 'object',
  title: 'Sign-in link or code',
  purpose: 'Send a one-time sign-in link or code',
  properties: {
    MAILER_SUBJECTS_MAGIC_LINK: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_MAGIC_LINK_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .ConfirmationURL }}\` : URL for a one-time sign-in to the user's account
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
    MAILER_SUBJECTS_MAGIC_LINK: z.string().min(1, 'Subject is required.'),
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
  purpose: 'Ask users to verify their new email address after changing it',
  properties: {
    MAILER_SUBJECTS_EMAIL_CHANGE: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_EMAIL_CHANGE_CONTENT: {
      title: 'Body',
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
    MAILER_SUBJECTS_EMAIL_CHANGE: z.string().min(1, 'Subject is required.'),
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
  purpose: 'Send a password reset link or code',
  properties: {
    MAILER_SUBJECTS_RECOVERY: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_RECOVERY_CONTENT: {
      title: 'Body',
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
    MAILER_SUBJECTS_RECOVERY: z.string().min(1, 'Subject is required.'),
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
  purpose: 'Ask users to verify their identity before a sensitive operation',
  properties: {
    MAILER_SUBJECTS_REAUTHENTICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_REAUTHENTICATION_CONTENT: {
      title: 'Body',
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
    MAILER_SUBJECTS_REAUTHENTICATION: z.string().min(1, 'Subject is required.'),
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
  title: 'Password changed',
  purpose: 'Notify users when their password has changed',
  properties: {
    MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_PASSWORD_CHANGED_NOTIFICATION_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Email }}\` : The user's email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: z.object({
    MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const EMAIL_CHANGED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'EMAIL_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Email address changed',
  purpose: 'Notify users when their email address has changed',
  properties: {
    MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_EMAIL_CHANGED_NOTIFICATION_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Email }}\` : The user's new email address
- \`{{ .OldEmail }}\` : The user's old email address
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: z.object({
    MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const PHONE_CHANGED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'PHONE_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Phone number changed',
  purpose: 'Notify users when their phone number has changed',
  properties: {
    MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_PHONE_CHANGED_NOTIFICATION_CONTENT: {
      title: 'Body',
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
  validationSchema: z.object({
    MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const IDENTITY_LINKED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'IDENTITY_LINKED_NOTIFICATION',
  type: 'object',
  title: 'New sign-in method linked',
  purpose: 'Notify users when a new sign-in method has been linked to their account',
  properties: {
    MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_IDENTITY_LINKED_NOTIFICATION_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Email }}\` : The user's email address
- \`{{ .Provider }}\` : The provider of the newly linked sign-in method
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: z.object({
    MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const IDENTITY_UNLINKED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'IDENTITY_UNLINKED_NOTIFICATION',
  type: 'object',
  title: 'Sign-in method removed',
  purpose: 'Notify users when a sign-in method has been removed from their account',
  properties: {
    MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_IDENTITY_UNLINKED_NOTIFICATION_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Email }}\` : The user's email address
- \`{{ .Provider }}\` : The provider of the removed sign-in method
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: z.object({
    MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const MFA_FACTOR_ENROLLED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MFA_FACTOR_ENROLLED_NOTIFICATION',
  type: 'object',
  title: 'Multi-factor authentication method added',
  purpose:
    'Notify users when a new multi-factor authentication method has been added to their account',
  properties: {
    MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_MFA_FACTOR_ENROLLED_NOTIFICATION_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Email }}\` : The user's email address
- \`{{ .FactorType }}\` : The type of verification method that was added
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: z.object({
    MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const MFA_FACTOR_UNENROLLED_NOTIFICATION: FormSchema = {
  $schema: JSON_SCHEMA_VERSION,
  id: 'MFA_FACTOR_UNENROLLED_NOTIFICATION',
  type: 'object',
  title: 'Multi-factor authentication method removed',
  purpose:
    'Notify users when a multi-factor authentication method has been removed from their account',
  properties: {
    MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION: {
      title: 'Subject',
      type: 'string',
    },
    MAILER_TEMPLATES_MFA_FACTOR_UNENROLLED_NOTIFICATION_CONTENT: {
      title: 'Body',
      descriptionOptional: 'HTML body of your email',
      type: 'code',
      description: `
- \`{{ .Email }}\` : The user's email address
- \`{{ .FactorType }}\` : The type of verification method that was removed
- \`{{ .Data }}\` : The user's \`user_metadata\`
`,
    },
  },
  validationSchema: z.object({
    MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
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
