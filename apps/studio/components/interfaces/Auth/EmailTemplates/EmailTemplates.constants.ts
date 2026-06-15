import {
  AUTH_TEMPLATE_TYPES,
  type AuthTemplateResetType,
  type AuthTemplateType,
} from './EmailTemplates.types'
import { getAuthTemplateType } from './EmailTemplates.utils'

export const AUTH_TEMPLATE_RESET_TYPES: AuthTemplateResetType[] =
  AUTH_TEMPLATE_TYPES.map(getAuthTemplateType)

/** Docs heading anchors for customizing-email-templates.mdx (ui Heading slugify output). */
export const EMAIL_TEMPLATE_DOCS_ANCHORS = {
  CONFIRMATION: 'authemailtemplateconfirmation',
  INVITE: 'authemailtemplateinvite',
  MAGIC_LINK: 'authemailtemplatemagiclink',
  EMAIL_CHANGE: 'authemailtemplateemailchange',
  RECOVERY: 'authemailtemplaterecovery',
  REAUTHENTICATION: 'authemailtemplatereauthentication',
  PASSWORD_CHANGED_NOTIFICATION: 'authemailnotificationpasswordchanged',
  EMAIL_CHANGED_NOTIFICATION: 'authemailnotificationemailchanged',
  PHONE_CHANGED_NOTIFICATION: 'authemailnotificationphonechanged',
  IDENTITY_LINKED_NOTIFICATION: 'authemailnotificationidentitylinked',
  IDENTITY_UNLINKED_NOTIFICATION: 'authemailnotificationidentityunlinked',
  MFA_FACTOR_ENROLLED_NOTIFICATION: 'authemailnotificationmfafactorenrolled',
  MFA_FACTOR_UNENROLLED_NOTIFICATION: 'authemailnotificationmfafactorunenrolled',
} as const satisfies Record<AuthTemplateType, string>
