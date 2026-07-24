import type { HTMLAttributes, ReactNode } from 'react'

export type AdmonitionType =
  | 'note'
  | 'tip'
  | 'caution'
  | 'danger'
  | 'deprecation'
  | 'default'
  | 'destructive'
  | 'success'
  | 'warning'

export type AdmonitionLayout = 'horizontal' | 'vertical' | 'responsive'

export interface AdmonitionProps {
  type?: AdmonitionType
  title?: string
  description?: ReactNode
  children?: ReactNode
  showIcon?: boolean
  childProps?: {
    title?: HTMLAttributes<HTMLDivElement>
    description?: HTMLAttributes<HTMLDivElement>
  }
  layout?: AdmonitionLayout
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}
