import type { AdmonitionType } from '../Admonition/Admonition.types'
import type { ErrorDisplayType } from './ErrorDisplay.types'

/** Container width in px at or above which the full layout renders. */
export const COMPACT_LAYOUT_BREAKPOINT = 400

export const TYPE_TO_VARIANT = {
  info: 'default',
  warning: 'warning',
  destructive: 'destructive',
} as const satisfies Record<ErrorDisplayType, 'default' | 'warning' | 'destructive'>

export const TYPE_TO_ADMONITION_TYPE = {
  info: 'default',
  warning: 'warning',
  destructive: 'destructive',
} as const satisfies Record<ErrorDisplayType, AdmonitionType>

export const TYPE_TO_ROLE = {
  info: 'status',
  warning: 'status',
  destructive: 'alert',
} as const satisfies Record<ErrorDisplayType, 'status' | 'alert'>

export const TYPE_TO_BORDER_CLASS = {
  info: 'border-default',
  warning: 'border-warning-400',
  destructive: 'border-destructive-400',
} as const satisfies Record<ErrorDisplayType, string>

export const TYPE_TO_SURFACE_CLASS = {
  info: 'bg-surface-100',
  warning: 'bg-warning-300/40',
  destructive: 'bg-destructive-300/40',
} as const satisfies Record<ErrorDisplayType, string>

export const TYPE_TO_DIVIDER_CLASS = {
  info: 'bg-border-strong',
  warning: 'bg-warning-400',
  destructive: 'bg-destructive-400',
} as const satisfies Record<ErrorDisplayType, string>

export const TYPE_TO_MONO_TEXT_CLASS = {
  info: 'text-foreground-light',
  warning: 'text-warning-600',
  destructive: 'text-destructive-600',
} as const satisfies Record<ErrorDisplayType, string>
