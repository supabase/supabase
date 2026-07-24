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

export type AdmonitionHeadingLevel = 'h2' | 'h3' | 'h4' | 'h5'

export interface AdmonitionProps {
  type?: AdmonitionType
  title?: string
  headingLevel?: AdmonitionHeadingLevel
  description?: ReactNode
  children?: ReactNode
  showIcon?: boolean
  childProps?: {
    title?: HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>
    description?: HTMLAttributes<HTMLDivElement>
  }
  layout?: AdmonitionLayout
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}
