import {
  AUTH_TEMPLATE_TYPES,
  type AuthTemplateResetType,
  type AuthTemplateType,
} from './EmailTemplates.types'
import { getAuthTemplateType } from './EmailTemplates.utils'

export const AUTH_TEMPLATE_RESET_TYPES: AuthTemplateResetType[] =
  AUTH_TEMPLATE_TYPES.map(getAuthTemplateType)

/** Docs heading anchors for customizing-email-templates.mdx (github-slugger output). */
export const EMAIL_TEMPLATE_DOCS_ANCHORS = {
  CONFIRMATION: 'authemailtemplateconfirmation',
  INVITE: 'authemailtemplateinvite',
  MAGIC_LINK: 'authemailtemplatemagic_link',
  EMAIL_CHANGE: 'authemailtemplateemail_change',
  RECOVERY: 'authemailtemplaterecovery',
  REAUTHENTICATION: 'authemailtemplatereauthentication',
  PASSWORD_CHANGED_NOTIFICATION: 'authemailnotificationpassword_changed',
  EMAIL_CHANGED_NOTIFICATION: 'authemailnotificationemail_changed',
  PHONE_CHANGED_NOTIFICATION: 'authemailnotificationphone_changed',
  IDENTITY_LINKED_NOTIFICATION: 'authemailnotificationidentity_linked',
  IDENTITY_UNLINKED_NOTIFICATION: 'authemailnotificationidentity_unlinked',
  MFA_FACTOR_ENROLLED_NOTIFICATION: 'authemailnotificationmfa_factor_enrolled',
  MFA_FACTOR_UNENROLLED_NOTIFICATION: 'authemailnotificationmfa_factor_unenrolled',
} as const satisfies Record<AuthTemplateType, string>
