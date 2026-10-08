import type { AdmonitionType } from '../Admonition/Admonition.types'
import type { ErrorDisplayType } from './ErrorDisplay.types'

/** Container width in px at or above which the full layout renders. */
export const COMPACT_LAYOUT_BREAKPOINT = 400

interface TypeStyle {
  variant: 'default' | 'warning' | 'destructive'
  admonition: AdmonitionType
  role: 'status' | 'alert'
  divider: string
}

export const TYPE_STYLES = {
  info: {
    variant: 'default',
    admonition: 'default',
    role: 'status',
    divider: 'bg-border-strong',
  },
  warning: {
    variant: 'warning',
    admonition: 'warning',
    role: 'status',
    divider: 'bg-warning-400',
  },
  destructive: {
    variant: 'destructive',
    admonition: 'destructive',
    role: 'alert',
    divider: 'bg-destructive-400',
  },
} as const satisfies Record<ErrorDisplayType, TypeStyle>
