import type { AdmonitionType } from './Admonition.types'

export const TYPE_TO_VARIANT = {
  note: 'default',
  tip: 'default',
  caution: 'warning',
  danger: 'destructive',
  deprecation: 'warning',
  default: 'default',
  warning: 'warning',
  destructive: 'destructive',
  success: 'default',
} as const satisfies Record<AdmonitionType, 'default' | 'warning' | 'destructive'>

export const TYPE_LABEL = {
  note: 'Note',
  tip: 'Tip',
  caution: 'Caution',
  danger: 'Danger',
  deprecation: 'Deprecated',
  default: 'Note',
  warning: 'Warning',
  destructive: 'Danger',
  success: 'Success',
} as const satisfies Record<AdmonitionType, string>
