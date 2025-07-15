'use client'

import * as React from 'react'

import { cn } from 'ui'
import { CodeBlockWrapper } from '@/components/code-block-wrapper'

interface ComponentSourceProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string
}

export function ComponentSource({ children, className, ...props }: ComponentSourceProps) {
  return (
    <CodeBlockWrapper
      expandButtonTitle="Expand"
      className={cn('my-6 overflow-hidden rounded-md', className)}
    >
      {children}
    </CodeBlockWrapper>
  )
}
