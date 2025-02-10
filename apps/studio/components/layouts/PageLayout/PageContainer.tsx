import React from 'react'
import { cn } from 'ui'
import { PAGE_SIZE_CLASSES, type PageSize } from 'ui/src/lib/constants'

interface PageContainerProps {
  children?: React.ReactNode
  className?: string
  size?: PageSize
}

const PageContainer = ({ children, className, size = 'default' }: PageContainerProps) => {
  return <div className={cn('mx-auto', PAGE_SIZE_CLASSES[size], className)}>{children}</div>
}

export default PageContainer
