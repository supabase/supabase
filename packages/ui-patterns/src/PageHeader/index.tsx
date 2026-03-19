'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import React, { createContext, useContext } from 'react'
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
// Context
// ============================================================================

type PageHeaderContextValue = {
  size: 'default' | 'small' | 'large' | 'full'
}

const PageHeaderContext = createContext<PageHeaderContextValue>({
  size: 'default',
})

const usePageHeaderContext = () => useContext(PageHeaderContext)

// ============================================================================
// Root
// ============================================================================

export type PageHeaderRootProps = React.ComponentProps<'div'> &
  VariantProps<typeof pageHeaderVariants>

/**
 * Root component for page header.
 * Renders children in order without searching for specific components.
 */
const PageHeaderRoot = ({ className, size, children, ...props }: PageHeaderRootProps) => {
  const contextSize: 'default' | 'small' | 'large' | 'full' = size ?? 'default'
  return (
    <PageHeaderContext.Provider value={{ size: contextSize }}>
      <div
        data-slot="page-header"
        data-size={contextSize}
        className={cn(pageHeaderVariants({ size: contextSize }), className)}
        {...props}
      >
        {children}
      </div>
    </PageHeaderContext.Provider>
  )
}

// ============================================================================
// Breadcrumb
// ============================================================================

export type PageHeaderBreadcrumbProps = React.ComponentProps<typeof Breadcrumb>

/**
 * Breadcrumb component for page header.
 * A wrapper around Breadcrumb with page header styling.
 * Should be placed as the first child of PageHeader.
 */
const PageHeaderBreadcrumb = ({ className, children, ...props }: PageHeaderBreadcrumbProps) => {
  const { size } = usePageHeaderContext()
  return (
    <PageContainer size={size}>
      <Breadcrumb
        data-slot="page-header-breadcrumb"
        className={cn('flex items-center gap-4 [&_li]:text-xs', className)}
        {...props}
      >
        {children}
      </Breadcrumb>
    </PageContainer>
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
      className={cn('text-foreground-light', className)}
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
 * Should be placed inside PageHeaderMeta.
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
// Meta
// ============================================================================

export type PageHeaderMetaProps = React.ComponentProps<'div'>

/**
 * Meta wrapper for page header.
 * Contains icon, summary, and aside components with proper layout.
 * Should be placed after PageHeaderBreadcrumb (if present) and before PageHeaderNavigationTabs.
 * Uses CSS to style children based on their data-slot attributes.
 */
const PageHeaderMeta = ({ className, children, ...props }: PageHeaderMetaProps) => {
  const { size } = usePageHeaderContext()
  return (
    <PageContainer size={size}>
      <div
        data-slot="page-header-meta"
        className={cn(
          'flex flex-col @xl:flex-row @xl:justify-between @xl:items-center gap-4',
          '[&>[data-slot="page-header-icon"]]:shrink-0',
          '[&>[data-slot="page-header-summary"]]:flex-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </PageContainer>
  )
}
PageHeaderMeta.displayName = 'PageHeaderMeta'

// ============================================================================
// Actions
// ============================================================================

export type PageHeaderAsideProps = React.ComponentProps<'div'>

/**
 * Actions component for page header.
 * Container for buttons and other action elements.
 * Should be placed inside PageHeaderMeta.
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

export type PageHeaderNavigationTabsProps = React.ComponentProps<'div'>

/**
 * Navigation component for page header.
 * Container for tab navigation (NavMenu).
 * Should be placed as the last child of PageHeader.
 */
const PageHeaderNavigationTabs = ({ className, ...props }: PageHeaderNavigationTabsProps) => {
  const { size } = usePageHeaderContext()
  return (
    <PageContainer size={size} className={cn(size === 'full' && 'border-b')}>
      <div
        data-slot="page-header-footer"
        className={cn('w-full [&>nav]:border-b-0', size !== 'full' && 'border-b', className)}
        {...props}
      />
    </PageContainer>
  )
}
PageHeaderNavigationTabs.displayName = 'PageHeaderNavigationTabs'

// ============================================================================
// Exports
// ============================================================================

export type PageHeaderProps = PageHeaderRootProps

/**
 * Page header root component.
 * Use PageHeader, PageHeaderBreadcrumb, PageHeaderMeta, PageHeaderIcon, etc.
 */
export {
  PageHeaderRoot as PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
}
