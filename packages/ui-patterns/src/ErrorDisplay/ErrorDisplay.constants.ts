import type { AdmonitionType } from '../Admonition/Admonition.types'
import type { ErrorDisplayType } from './ErrorDisplay.types'

/** Container width in px at or above which the full layout renders. */
export const COMPACT_LAYOUT_BREAKPOINT = 400

interface TypeStyle {
  variant: 'default' | 'warning' | 'destructive'
  admonition: AdmonitionType
  role: 'status' | 'alert'
  border: string
  surface: string
  divider: string
  mono: string
}

export const TYPE_STYLES = {
  info: {
    variant: 'default',
    admonition: 'default',
    role: 'status',
    border: 'border-default',
    surface: 'bg-surface-100',
    divider: 'bg-border-strong',
    mono: 'text-foreground-light',
  },
  warning: {
    variant: 'warning',
    admonition: 'warning',
    role: 'status',
    border: 'border-warning-400',
    surface: 'bg-warning-300/40',
    divider: 'bg-warning-400',
    mono: 'text-warning-600',
  },
  destructive: {
    variant: 'destructive',
    admonition: 'destructive',
    role: 'alert',
    border: 'border-destructive-400',
    surface: 'bg-destructive-300/40',
    divider: 'bg-destructive-400',
    mono: 'text-destructive-600',
  },
} as const satisfies Record<ErrorDisplayType, TypeStyle>
