import * as z from 'zod'

import type { AuthTemplate, TemplateVariable, TemplateVariableName } from './EmailTemplates.types'

const TemplateVariables: Record<TemplateVariableName, TemplateVariable> = {
  ConfirmationURL: {
    name: 'ConfirmationURL',
    value: '{{ .ConfirmationURL }}',
    description: 'URL to confirm the email address for the new account',
  },
  Token: {
    name: 'Token',
    value: '{{ .Token }}',
    description: 'The 6-digit numeric email OTP',
  },
  TokenHash: {
    name: 'TokenHash',
    value: '{{ .TokenHash }}',
    description: 'The hashed token used in the URL, useful for constructing your own email link',
  },
  SiteURL: {
    name: 'SiteURL',
    value: '{{ .SiteURL }}',
    description: "This project's redirect URL",
  },
  Email: {
    name: 'Email',
    value: '{{ .Email }}',
    description: "The user's current email address",
  },
  NewEmail: {
    name: 'NewEmail',
    value: '{{ .NewEmail }}',
    description: "The user's new email address",
  },
  OldEmail: {
    name: 'OldEmail',
    value: '{{ .OldEmail }}',
    description: "The user's old email address",
  },
  Phone: {
    name: 'Phone',
    value: '{{ .Phone }}',
    description: "The user's new phone number",
  },
  OldPhone: {
    name: 'OldPhone',
    value: '{{ .OldPhone }}',
    description: "The user's old phone number",
  },
  Provider: {
    name: 'Provider',
    value: '{{ .Provider }}',
    description: 'The provider of the newly linked/unlinked identity',
  },
  FactorType: {
    name: 'FactorType',
    value: '{{ .FactorType }}',
    description: 'The type of the newly enrolled/unenrolled MFA factor',
  },
  Data: {
    name: 'Data',
    value: '{{ .Data }}',
    description: (
      <>
        The user's <code className="text-code-inline">user_metadata</code>
      </>
    ),
  },
  // [Joshen] To check if this is deprecated - no longer in the docs
  RedirectTo: {
    name: 'RedirectTo',
    value: '{{ .RedirectTo }}',
    description: (
      <>
        The URL of <code className="text-code-inline">emailRedirectTo</code> passed in options
      </>
    ),
  },
}

const CONFIRMATION: AuthTemplate = {
  id: 'CONFIRMATION',
  type: 'object',
  title: 'Confirm sign up',
  purpose: 'Ask users to confirm their email address after signing up',
  properties: {
    MAILER_SUBJECTS_CONFIRMATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_CONFIRMATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.ConfirmationURL,
    TemplateVariables.Token,
    TemplateVariables.TokenHash,
    TemplateVariables.SiteURL,
    TemplateVariables.Email,
    TemplateVariables.Data,
    TemplateVariables.RedirectTo,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_CONFIRMATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const INVITE: AuthTemplate = {
  id: 'INVITE',
  type: 'object',
  title: 'Invite user',
  purpose: "Invite users who don't yet have an account to sign up",
  properties: {
    MAILER_SUBJECTS_INVITE: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_INVITE_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.ConfirmationURL,
    TemplateVariables.Token,
    TemplateVariables.TokenHash,
    TemplateVariables.SiteURL,
    TemplateVariables.Email,
    TemplateVariables.Data,
    TemplateVariables.RedirectTo,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_INVITE: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const MAGIC_LINK: AuthTemplate = {
  id: 'MAGIC_LINK',
  type: 'object',
  title: 'Magic link or OTP',
  purpose: 'Send a one-time sign-in link or one-time password',
  properties: {
    MAILER_SUBJECTS_MAGIC_LINK: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_MAGIC_LINK_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.ConfirmationURL,
    TemplateVariables.Token,
    TemplateVariables.TokenHash,
    TemplateVariables.SiteURL,
    TemplateVariables.Email,
    TemplateVariables.Data,
    TemplateVariables.RedirectTo,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_MAGIC_LINK: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const EMAIL_CHANGE: AuthTemplate = {
  id: 'EMAIL_CHANGE',
  type: 'object',
  title: 'Change email address',
  purpose: 'Ask users to verify their new email address after changing it',
  properties: {
    MAILER_SUBJECTS_EMAIL_CHANGE: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_EMAIL_CHANGE_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.ConfirmationURL,
    TemplateVariables.Token,
    TemplateVariables.TokenHash,
    TemplateVariables.SiteURL,
    TemplateVariables.Email,
    TemplateVariables.NewEmail,
    TemplateVariables.Data,
    TemplateVariables.RedirectTo,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_EMAIL_CHANGE: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const RECOVERY: AuthTemplate = {
  id: 'RECOVERY',
  type: 'object',
  title: 'Reset password',
  purpose: 'Allow users to reset their password if they forget it',
  properties: {
    MAILER_SUBJECTS_RECOVERY: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_RECOVERY_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.ConfirmationURL,
    TemplateVariables.Token,
    TemplateVariables.TokenHash,
    TemplateVariables.SiteURL,
    TemplateVariables.Email,
    TemplateVariables.Data,
    TemplateVariables.RedirectTo,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_RECOVERY: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

const REAUTHENTICATION: AuthTemplate = {
  id: 'REAUTHENTICATION',
  type: 'object',
  title: 'Reauthentication',
  purpose: 'Ask users to re-authenticate before performing a sensitive action',
  properties: {
    MAILER_SUBJECTS_REAUTHENTICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_REAUTHENTICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.Token,
    TemplateVariables.SiteURL,
    TemplateVariables.Email,
    TemplateVariables.Data,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_REAUTHENTICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'authentication',
  },
}

// Notifications
const PASSWORD_CHANGED_NOTIFICATION: AuthTemplate = {
  id: 'PASSWORD_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Password changed',
  purpose: 'Notify users when their password has changed',
  properties: {
    MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_PASSWORD_CHANGED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [TemplateVariables.Email, TemplateVariables.Data],
  validationSchema: z.object({
    MAILER_SUBJECTS_PASSWORD_CHANGED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const EMAIL_CHANGED_NOTIFICATION: AuthTemplate = {
  id: 'EMAIL_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Email address changed',
  purpose: 'Notify users when their email address has changed',
  properties: {
    MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_EMAIL_CHANGED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [TemplateVariables.Email, TemplateVariables.OldEmail, TemplateVariables.Data],
  validationSchema: z.object({
    MAILER_SUBJECTS_EMAIL_CHANGED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const PHONE_CHANGED_NOTIFICATION: AuthTemplate = {
  id: 'PHONE_CHANGED_NOTIFICATION',
  type: 'object',
  title: 'Phone number changed',
  purpose: 'Notify users when their phone number has changed',
  properties: {
    MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_PHONE_CHANGED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [
    TemplateVariables.Email,
    TemplateVariables.Phone,
    TemplateVariables.OldPhone,
    TemplateVariables.Data,
  ],
  validationSchema: z.object({
    MAILER_SUBJECTS_PHONE_CHANGED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const IDENTITY_LINKED_NOTIFICATION: AuthTemplate = {
  id: 'IDENTITY_LINKED_NOTIFICATION',
  type: 'object',
  title: 'Identity linked',
  purpose: 'Notify users when a new identity has been linked to their account',
  properties: {
    MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_IDENTITY_LINKED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [TemplateVariables.Email, TemplateVariables.Provider, TemplateVariables.Data],
  validationSchema: z.object({
    MAILER_SUBJECTS_IDENTITY_LINKED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const IDENTITY_UNLINKED_NOTIFICATION: AuthTemplate = {
  id: 'IDENTITY_UNLINKED_NOTIFICATION',
  type: 'object',
  title: 'Identity unlinked',
  purpose: 'Notify users when an identity has been unlinked from their account',
  properties: {
    MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_IDENTITY_UNLINKED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [TemplateVariables.Email, TemplateVariables.Provider, TemplateVariables.Data],
  validationSchema: z.object({
    MAILER_SUBJECTS_IDENTITY_UNLINKED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const MFA_FACTOR_ENROLLED_NOTIFICATION: AuthTemplate = {
  id: 'MFA_FACTOR_ENROLLED_NOTIFICATION',
  type: 'object',
  title: 'MFA method added',
  purpose: 'Notify users when an MFA method has been added to their account',
  properties: {
    MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_MFA_FACTOR_ENROLLED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [TemplateVariables.Email, TemplateVariables.FactorType, TemplateVariables.Data],
  validationSchema: z.object({
    MAILER_SUBJECTS_MFA_FACTOR_ENROLLED_NOTIFICATION: z.string().min(1, 'Subject is required.'),
  }),
  misc: {
    emailTemplateType: 'security',
  },
}

const MFA_FACTOR_UNENROLLED_NOTIFICATION: AuthTemplate = {
  id: 'MFA_FACTOR_UNENROLLED_NOTIFICATION',
  type: 'object',
  title: 'MFA method removed',
  purpose: 'Notify users when an MFA method has been removed from their account',
  properties: {
    MAILER_SUBJECTS_MFA_FACTOR_UNENROLLED_NOTIFICATION: { title: 'Subject', type: 'string' },
    MAILER_TEMPLATES_MFA_FACTOR_UNENROLLED_NOTIFICATION_CONTENT: { title: 'Body', type: 'code' },
  },
  variables: [TemplateVariables.Email, TemplateVariables.FactorType, TemplateVariables.Data],
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
