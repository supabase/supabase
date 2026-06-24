import type { AuthTemplateType } from './EmailTemplates.types'

export type TemplateFlowMode = 'link' | 'otp' | 'both'

export type FlowPickerTemplateId = Extract<
  AuthTemplateType,
  'CONFIRMATION' | 'MAGIC_LINK' | 'RECOVERY' | 'EMAIL_CHANGE'
>

export const FLOW_PICKER_TEMPLATE_IDS: FlowPickerTemplateId[] = [
  'CONFIRMATION',
  'MAGIC_LINK',
  'RECOVERY',
  'EMAIL_CHANGE',
]

export const TEMPLATE_FLOW_MODE_OPTIONS: {
  value: TemplateFlowMode
  label: string
  helperText: string
}[] = [
  {
    value: 'link',
    label: 'Link',
    helperText: 'Users click a confirmation link in the email.',
  },
  {
    value: 'otp',
    label: 'One-time code',
    helperText: 'Users enter a 6-digit code from the email.',
  },
  {
    value: 'both',
    label: 'Link and code',
    helperText: 'Users can either click the link or enter the code.',
  },
]

type TemplateFlowVariant = {
  subject: string
  body: string
}

type TemplateFlowVariants = Record<TemplateFlowMode, TemplateFlowVariant>

const CONFIRMATION_VARIANTS: TemplateFlowVariants = {
  link: {
    subject: 'Confirm your email address',
    body: '<h2>Confirm your email address</h2><p>Follow the link below to confirm this email address and finish signing up.</p><p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>',
  },
  otp: {
    subject: '{{ .Token }} is your confirmation code',
    body: '<h2>Confirm your email address</h2><p>Use the code below to confirm this email address and finish signing up. It expires shortly.</p><p>{{ .Token }}</p>',
  },
  both: {
    subject: 'Confirm your email address',
    body: '<h2>Confirm your email address</h2><p>Follow the link below to confirm this email address and finish signing up.</p><p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p><p>Alternatively, enter this code: {{ .Token }}</p>',
  },
}

const MAGIC_LINK_VARIANTS: TemplateFlowVariants = {
  link: {
    subject: 'Your sign-in link',
    body: '<h2>Your sign-in link</h2><p>Follow the link below to sign in. This link expires shortly and can only be used once.</p><p><a href="{{ .ConfirmationURL }}">Sign in</a></p>',
  },
  otp: {
    subject: '{{ .Token }} is your sign-in code',
    body: '<h2>Your sign-in code</h2><p>Use the code below to sign in. It expires shortly and can only be used once.</p><p>{{ .Token }}</p>',
  },
  both: {
    subject: 'Your sign-in link',
    body: '<h2>Your sign-in link</h2><p>Follow the link below to sign in. This link expires shortly and can only be used once.</p><p><a href="{{ .ConfirmationURL }}">Sign in</a></p><p>Alternatively, enter this code: {{ .Token }}</p>',
  },
}

const RECOVERY_VARIANTS: TemplateFlowVariants = {
  link: {
    subject: 'Reset your password',
    body: '<h2>Reset your password</h2><p>We received a request to reset your password. Follow the link below to choose a new one.</p><p><a href="{{ .ConfirmationURL }}">Reset password</a></p><p>If you didn\'t request this, you can safely ignore this email.</p>',
  },
  otp: {
    subject: '{{ .Token }} is your password reset code',
    body: "<h2>Reset your password</h2><p>We received a request to reset your password. Use the code below to choose a new one. It expires shortly.</p><p>{{ .Token }}</p><p>If you didn't request this, you can safely ignore this email.</p>",
  },
  both: {
    subject: 'Reset your password',
    body: '<h2>Reset your password</h2><p>We received a request to reset your password. Follow the link below to choose a new one.</p><p><a href="{{ .ConfirmationURL }}">Reset password</a></p><p>Alternatively, enter this code: {{ .Token }}</p><p>If you didn\'t request this, you can safely ignore this email.</p>',
  },
}

const EMAIL_CHANGE_VARIANTS: TemplateFlowVariants = {
  link: {
    subject: 'Confirm your new email address',
    body: '<h2>Confirm your new email address</h2><p>Follow the link below to confirm {{ .NewEmail }} as your new email address.</p><p><a href="{{ .ConfirmationURL }}">Confirm new email address</a></p><p>If you didn\'t request this change, you can safely ignore this email.</p>',
  },
  otp: {
    subject: '{{ .Token }} is your email change code',
    body: "<h2>Confirm your new email address</h2><p>Use the code below to confirm {{ .NewEmail }} as your new email address. It expires shortly.</p><p>{{ .Token }}</p><p>If you didn't request this change, you can safely ignore this email.</p>",
  },
  both: {
    subject: 'Confirm your new email address',
    body: '<h2>Confirm your new email address</h2><p>Follow the link below to confirm {{ .NewEmail }} as your new email address.</p><p><a href="{{ .ConfirmationURL }}">Confirm new email address</a></p><p>Alternatively, enter this code: {{ .Token }}</p><p>If you didn\'t request this change, you can safely ignore this email.</p>',
  },
}

const TEMPLATE_FLOW_VARIANTS: Record<FlowPickerTemplateId, TemplateFlowVariants> = {
  CONFIRMATION: CONFIRMATION_VARIANTS,
  MAGIC_LINK: MAGIC_LINK_VARIANTS,
  RECOVERY: RECOVERY_VARIANTS,
  EMAIL_CHANGE: EMAIL_CHANGE_VARIANTS,
}

export const supportsTemplateFlowPicker = (
  templateId: AuthTemplateType
): templateId is FlowPickerTemplateId => {
  return FLOW_PICKER_TEMPLATE_IDS.includes(templateId as FlowPickerTemplateId)
}

export const getTemplateFlowVariant = (
  templateId: FlowPickerTemplateId,
  mode: TemplateFlowMode
): TemplateFlowVariant => {
  return TEMPLATE_FLOW_VARIANTS[templateId][mode]
}

export const inferTemplateFlowMode = (
  templateId: FlowPickerTemplateId,
  subject: string,
  body: string
): TemplateFlowMode | null => {
  const variants = TEMPLATE_FLOW_VARIANTS[templateId]

  for (const mode of ['link', 'otp', 'both'] as const) {
    if (variants[mode].subject === subject && variants[mode].body === body) {
      return mode
    }
  }

  return null
}
