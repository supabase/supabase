import { ReactNode } from 'react'
import z from 'zod'

export type KebabCase<S extends string> = S extends `${infer A}_${infer B}`
  ? `${Lowercase<A>}-${KebabCase<B>}`
  : Lowercase<S>

export const AUTH_TEMPLATE_TYPES = [
  'CONFIRMATION',
  'EMAIL_CHANGE',
  'INVITE',
  'MAGIC_LINK',
  'RECOVERY',
  'REAUTHENTICATION',
  'PASSWORD_CHANGED_NOTIFICATION',
  'EMAIL_CHANGED_NOTIFICATION',
  'PHONE_CHANGED_NOTIFICATION',
  'IDENTITY_LINKED_NOTIFICATION',
  'IDENTITY_UNLINKED_NOTIFICATION',
  'MFA_FACTOR_ENROLLED_NOTIFICATION',
  'MFA_FACTOR_UNENROLLED_NOTIFICATION',
] as const

export type AuthTemplateType = (typeof AUTH_TEMPLATE_TYPES)[number]
export type AuthTemplateResetType = KebabCase<AuthTemplateType>

export type TemplateVariableName =
  | 'ConfirmationURL'
  | 'Token'
  | 'TokenHash'
  | 'SiteURL'
  | 'Email'
  | 'NewEmail'
  | 'OldEmail'
  | 'Phone'
  | 'OldPhone'
  | 'Provider'
  | 'FactorType'
  | 'Data'
  | 'RedirectTo'

export type TemplateVariable = {
  name: TemplateVariableName
  value: string
  description: string | ReactNode
}

export interface AuthTemplate {
  id: AuthTemplateType
  type: 'object'
  title: string
  purpose: string
  properties: {
    [x: string]: {
      title: string
      type: 'boolean' | 'string' | 'select' | 'number' | 'code'
      description?: string
      descriptionOptional?: string
    }
  }
  variables: TemplateVariable[]
  validationSchema: z.AnyZodObject
  misc: { emailTemplateType: 'authentication' | 'security' }
}
