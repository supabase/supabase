import React from 'react'
import { cn } from 'ui'

interface PageContentProps {
  children?: React.ReactNode
  size?: 'default' | 'small' | 'medium' | 'large' | 'full'
  className?: string
}

const sizeClasses = {
  small: 'max-w-3xl px-8',
  medium: 'max-w-5xl px-8',
  large: 'max-w-7xl px-8',
  default: 'max-w-5xl px-8',
  full: 'w-full',
}

export function PageContent({ children, size = 'default', className }: PageContentProps) {
  return <div className={cn('mx-auto w-full', sizeClasses[size], className)}>{children}</div>
}

export type { PageContentProps }
