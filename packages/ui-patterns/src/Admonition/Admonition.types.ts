import type { HTMLAttributes, ReactNode } from 'react'

export type AdmonitionType =
  | 'note'
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
    title?: HTMLAttributes<HTMLParagraphElement>
    description?: HTMLAttributes<HTMLDivElement>
  }
  layout?: AdmonitionLayout
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}
