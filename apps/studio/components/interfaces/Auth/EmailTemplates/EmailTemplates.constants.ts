import { AUTH_TEMPLATE_TYPES, type AuthTemplateResetType } from './EmailTemplates.types'
import { getAuthTemplateType } from './EmailTemplates.utils'

export const AUTH_TEMPLATE_RESET_TYPES: AuthTemplateResetType[] =
  AUTH_TEMPLATE_TYPES.map(getAuthTemplateType)
