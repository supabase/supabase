import React from 'react'
import { cn } from 'ui'

interface PageContentProps {
  children?: React.ReactNode
  size?: 'default' | 'small' | 'medium' | 'large' | 'full'
  className?: string
}

const sizeClasses = {
  small: 'max-w-3xl',
  medium: 'max-w-5xl',
  large: 'max-w-7xl',
  default: 'max-w-5xl',
  full: 'w-full',
}

export function PageContent({ children, size = 'default', className }: PageContentProps) {
  return <div className={cn('mx-auto w-full px-8', sizeClasses[size], className)}>{children}</div>
}

export type { PageContentProps }
