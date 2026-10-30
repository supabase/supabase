'use client'

import React from 'react'
import { cn } from 'ui'

import { PageContainer } from '../PageContainer'

const pageChromeClassName = 'px-4 xl:px-4'

export type PageNavProps = React.ComponentProps<'div'>

/**
 * Full-width sub-navigation row for page chrome (wraps `NavMenu`).
 * Sits below `PageBreadcrumbs` and outside `PageHeader`.
 */
const PageNav = ({ className, ...props }: PageNavProps) => {
  return (
    <PageContainer
      data-slot="page-nav"
      size="full"
      className={cn('flex min-h-(--header-height) items-center border-b', pageChromeClassName)}
    >
      <div
        data-slot="page-nav-menu"
        className={cn(
          'flex min-h-(--header-height) w-full items-center',
          '[&>nav]:flex [&>nav]:h-(--header-height) [&>nav]:items-center [&>nav]:border-b-0',
          '[&>nav>ul]:h-full [&>nav>ul]:items-center',
          '[&>nav>ul>li]:h-full',
          className
        )}
        {...props}
      />
    </PageContainer>
  )
}
PageNav.displayName = 'PageNav'

export { PageNav }
