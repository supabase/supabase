'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

import { cn } from 'ui'
import { Breadcrumb } from 'ui/src/components/shadcn/ui/breadcrumb'
import { PageContainer } from '../PageContainer'

// ============================================================================
// Variants
// ============================================================================

const pageHeaderVariants = cva(['flex flex-col gap-4 w-full'], {
  variants: {
    size: {
      default: 'pt-12',
      small: 'pt-12',
      large: 'pt-12',
      full: 'pt-6',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

// ============================================================================
// Root
// ============================================================================

export type PageHeaderRootProps = React.ComponentProps<'div'> &
  VariantProps<typeof pageHeaderVariants> & {
    size?: 'default' | 'small' | 'large' | 'full'
  }

/**
 * Root component for page header.
 * Enforces structure by rendering components in order.
 */
const PageHeaderRoot = ({
  className,
  size = 'default',
  children,
  ...props
}: PageHeaderRootProps) => {
  // Convert children to an array for easier manipulation
  const childrenArray = React.Children.toArray(children)

  // Filter out specific components by their displayName
  const breadcrumb = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageHeaderBreadcrumb ||
        (child.type as any)?.displayName === 'PageHeaderBreadcrumb')
  )

  const icon = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageHeaderIcon || (child.type as any)?.displayName === 'PageHeaderIcon')
  )

  const summary = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageHeaderSummary || (child.type as any)?.displayName === 'PageHeaderSummary')
  )

  const aside = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageHeaderAside || (child.type as any)?.displayName === 'PageHeaderAside')
  )

  const footer = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageHeaderFooter || (child.type as any)?.displayName === 'PageHeaderFooter')
  )

  const rest = childrenArray.filter(
    (child: React.ReactNode) =>
      React.isValidElement(child) && !breadcrumb && !icon && !summary && !aside && !footer
  )

  return (
    <div
      data-slot="page-header"
      data-size={size}
      className={cn(pageHeaderVariants({ size }), className)}
      {...props}
    >
      {/* Breadcrumb section - max-width based on size */}
      {breadcrumb && <PageContainer size={size}>{breadcrumb}</PageContainer>}

      {/* Main content section - Icon, Summary, Aside with max-width based on size */}
      {(icon || summary || aside) && (
        <PageContainer size={size}>
          <div
            className={cn('flex flex-col @xl:flex-row @xl:justify-between @xl:items-center gap-4')}
          >
            <div className="flex items-center gap-4">
              {icon}
              {summary}
            </div>
            {aside}
          </div>
          {rest}
        </PageContainer>
      )}

      {/* Footer section - full width wrapper with border, but inner content has max-width unless size is full */}
      {footer && (
        <PageContainer size={size} className={cn(size === 'full' && 'border-b')}>
          <div className={cn(size !== 'full' && 'border-b', 'w-full')}>{footer}</div>
        </PageContainer>
      )}
    </div>
  )
}

// ============================================================================
// Breadcrumb
// ============================================================================

export type PageHeaderBreadcrumbProps = React.ComponentProps<typeof Breadcrumb>

/**
 * Breadcrumb component for page header.
 * A wrapper around Breadcrumb with page header styling.
 */
const PageHeaderBreadcrumb = ({ className, children, ...props }: PageHeaderBreadcrumbProps) => {
  return (
    <Breadcrumb
      data-slot="page-header-breadcrumb"
      className={cn('flex items-center gap-4 [&_li]:text-xs', className)}
      {...props}
    >
      {children}
    </Breadcrumb>
  )
}
PageHeaderBreadcrumb.displayName = 'PageHeaderBreadcrumb'

// ============================================================================
// Icon
// ============================================================================

export type PageHeaderIconProps = React.ComponentProps<'div'>

/**
 * Icon component for page header.
 * Positioned to the left of title and description.
 */
const PageHeaderIcon = ({ className, ...props }: PageHeaderIconProps) => {
  return (
    <div
      data-slot="page-header-icon"
      className={cn('text-foreground-light shrink-0', className)}
      {...props}
    />
  )
}
PageHeaderIcon.displayName = 'PageHeaderIcon'

// ============================================================================
// Summary
// ============================================================================

export type PageHeaderSummaryProps = React.ComponentProps<'div'>

/**
 * Summary component to contain title and description.
 * Provides layout structure for text content.
 */
const PageHeaderSummary = ({ className, children, ...props }: PageHeaderSummaryProps) => {
  return (
    <div
      data-slot="page-header-summary"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    >
      {children}
    </div>
  )
}
PageHeaderSummary.displayName = 'PageHeaderSummary'

// ============================================================================
// Title
// ============================================================================

export type PageHeaderTitleProps = React.ComponentProps<'h1'>

/**
 * Title component for page header.
 * Primary heading for the page.
 */
const PageHeaderTitle = ({ className, children, ...props }: PageHeaderTitleProps) => {
  return (
    <h1 data-slot="page-header-title" className={cn('heading-title', className)} {...props}>
      {children}
    </h1>
  )
}

// ============================================================================
// Description
// ============================================================================

export type PageHeaderDescriptionProps = React.ComponentProps<'div'>

/**
 * Description component for page header.
 * Supporting text rendered below the title.
 */
const PageHeaderDescription = ({ className, children, ...props }: PageHeaderDescriptionProps) => {
  return (
    <div
      data-slot="page-header-description"
      className={cn('heading-subSection text-foreground-light', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Actions
// ============================================================================

export type PageHeaderAsideProps = React.ComponentProps<'div'>

/**
 * Actions component for page header.
 * Container for buttons and other action elements.
 */
const PageHeaderAside = ({ className, ...props }: PageHeaderAsideProps) => {
  return (
    <div
      data-slot="page-header-actions"
      className={cn('flex items-center gap-2 shrink-0', className)}
      {...props}
    />
  )
}
PageHeaderAside.displayName = 'PageHeaderAside'

// ============================================================================
// Navigation
// ============================================================================

export type PageHeaderFooterProps = React.ComponentProps<'div'>

/**
 * Navigation component for page header.
 * Container for tab navigation (NavMenu).
 */
const PageHeaderFooter = ({ className, ...props }: PageHeaderFooterProps) => {
  return (
    <div
      data-slot="page-header-footer"
      className={cn('w-full [&>nav]:border-b-0', className)}
      {...props}
    />
  )
}
PageHeaderFooter.displayName = 'PageHeaderFooter'

// ============================================================================
// Compound Component
// ============================================================================

export type PageHeaderProps = PageHeaderRootProps

/**
 * Compound component for page header.
 * Use PageHeader.Root, PageHeader.Breadcrumb, PageHeader.Summary, etc.
 */
export const PageHeader = Object.assign(PageHeaderRoot, {
  Root: PageHeaderRoot,
  Breadcrumb: PageHeaderBreadcrumb,
  Icon: PageHeaderIcon,
  Summary: PageHeaderSummary,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
  Aside: PageHeaderAside,
  Footer: PageHeaderFooter,
})
