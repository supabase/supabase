'use client'

import React from 'react'
import { cn } from 'ui'

import { PageContainer } from '../PageContainer'

const pageChromeClassName = 'px-4 xl:px-4'

export type PageNavProps = React.ComponentProps<'div'> & {
  /**
   * Width of the nav content. The bottom border always spans the full width.
   * Match the `size` of the sibling `PageHeader` / `PageContainer` so tabs align with page content.
   * Defaults to `full` (edge-to-edge chrome padding).
   */
  size?: React.ComponentProps<typeof PageContainer>['size']
}

/**
 * Sub-navigation row for page chrome (wraps `NavMenu`).
 * Sits below `PageBreadcrumbs` and outside `PageHeader`.
 */
const PageNav = ({ className, size = 'full', ...props }: PageNavProps) => {
  return (
    <div data-slot="page-nav" className="w-full border-b">
      <PageContainer
        size={size}
        className={cn(
          'flex min-h-(--header-height) items-center',
          size === 'full' && pageChromeClassName
        )}
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
    </div>
  )
}
PageNav.displayName = 'PageNav'

export { PageNav }
