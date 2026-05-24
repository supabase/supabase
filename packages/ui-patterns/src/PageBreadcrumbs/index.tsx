'use client'

import React from 'react'
import { cn } from 'ui'
import { Breadcrumb } from 'ui/src/components/shadcn/ui/breadcrumb'

import { PageContainer } from '../PageContainer'

const pageChromeClassName = 'px-4 xl:px-4'

// ============================================================================
// Actions
// ============================================================================

export type PageBreadcrumbsActionsProps = React.ComponentProps<'div'>

/**
 * Actions for the page breadcrumbs row.
 * Pass as the `actions` prop on `PageBreadcrumbs`.
 */
const PageBreadcrumbsActions = ({ className, ...props }: PageBreadcrumbsActionsProps) => {
  return (
    <div
      data-slot="page-breadcrumbs-actions"
      className={cn('ml-auto flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  )
}
PageBreadcrumbsActions.displayName = 'PageBreadcrumbsActions'

// ============================================================================
// Breadcrumbs
// ============================================================================

export type PageBreadcrumbsProps = React.ComponentProps<typeof Breadcrumb> & {
  actions?: React.ReactNode
  containerClassName?: string
}

/**
 * Full-width breadcrumb row for page chrome.
 * Sits above `PageHeader` and page content — not inside `PageHeader`.
 */
const PageBreadcrumbs = ({
  actions,
  className,
  children,
  containerClassName,
  ...props
}: PageBreadcrumbsProps) => {
  return (
    <div data-slot="page-breadcrumbs" className="border-b">
      <PageContainer
        size="full"
        className={cn(
          'flex min-h-12 items-center justify-between gap-4 py-2',
          pageChromeClassName,
          containerClassName
        )}
      >
        <Breadcrumb
          data-slot="page-breadcrumbs-list"
          className={cn('min-w-0 flex items-center gap-4 [&_li]:text-sm', className)}
          {...props}
        >
          {children}
        </Breadcrumb>
        {actions}
      </PageContainer>
    </div>
  )
}
PageBreadcrumbs.displayName = 'PageBreadcrumbs'

export { PageBreadcrumbs, PageBreadcrumbsActions }
