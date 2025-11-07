'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

import { cn } from 'ui'

// ============================================================================
// Variants
// ============================================================================

const pageSectionRootVariants = cva(['pt-12 last:pb-12 gap-6'], {
  variants: {
    orientation: {
      horizontal: 'grid @3xl:grid-cols-[1fr_2fr] @3xl:gap-12',
      vertical: 'flex flex-col',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

// ============================================================================
// Root
// ============================================================================

export type PageSectionRootProps = React.ComponentProps<'div'> &
  VariantProps<typeof pageSectionRootVariants> & {
    orientation?: 'horizontal' | 'vertical'
  }

/**
 * Root component for page section.
 * Provides layout structure for section content with orientation variants.
 */
const PageSectionRoot = ({
  className,
  orientation = 'vertical',
  children,
  ...props
}: PageSectionRootProps) => {
  // Convert children to an array for easier manipulation
  const childrenArray = React.Children.toArray(children)

  // Filter out specific components by their displayName
  const summary = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageSectionSummary ||
        (child.type as any)?.displayName === 'PageSectionSummary')
  )

  const aside = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageSectionAside || (child.type as any)?.displayName === 'PageSectionAside')
  )

  const content = childrenArray.find(
    (child: React.ReactNode) =>
      React.isValidElement(child) &&
      (child.type === PageSectionContent ||
        (child.type as any)?.displayName === 'PageSectionContent')
  )
  const rest = childrenArray.filter(
    (child: React.ReactNode) => React.isValidElement(child) && !summary && !aside && !content
  )

  return (
    <div
      data-slot="page-section"
      data-orientation={orientation}
      className={cn(pageSectionRootVariants({ orientation }), className)}
      {...props}
    >
      {/* Header wrapper: Summary + Aside */}
      {(summary || aside) && (
        <div className="@container">
          <div
            data-slot="page-section-summary"
            className={cn('flex flex-col @xl:flex-row @xl:justify-between @xl:items-center gap-4')}
          >
            {summary}
            {aside}
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {content}
        {rest}
      </div>
    </div>
  )
}

PageSectionRoot.displayName = 'PageSectionRoot'

// ============================================================================
// Summary
// ============================================================================

export type PageSectionSummaryProps = React.ComponentProps<'div'>

/**
 * Summary component to contain title and description.
 * Provides layout structure for text content.
 */
const PageSectionSummary = ({ className, children, ...props }: PageSectionSummaryProps) => {
  return (
    <div
      data-slot="page-section-summary"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    >
      {children}
    </div>
  )
}
PageSectionSummary.displayName = 'PageSectionSummary'

// ============================================================================
// Title
// ============================================================================

export type PageSectionTitleProps = React.ComponentProps<'h2'>

/**
 * Title component for page section.
 * Primary heading for the section.
 */
const PageSectionTitle = ({ className, children, ...props }: PageSectionTitleProps) => {
  return (
    <h2 data-slot="page-section-title" className={cn('heading-section', className)} {...props}>
      {children}
    </h2>
  )
}
PageSectionTitle.displayName = 'PageSectionTitle'

// ============================================================================
// Description
// ============================================================================

export type PageSectionDescriptionProps = React.ComponentProps<'div'>

/**
 * Description component for page section.
 * Supporting text rendered below the title.
 */
const PageSectionDescription = ({ className, children, ...props }: PageSectionDescriptionProps) => {
  return (
    <div
      data-slot="page-section-description"
      className={cn('text-sm text-foreground-light', className)}
      {...props}
    >
      {children}
    </div>
  )
}
PageSectionDescription.displayName = 'PageSectionDescription'

// ============================================================================
// Aside
// ============================================================================

export type PageSectionAsideProps = React.ComponentProps<'div'>

/**
 * Aside component for page section.
 * Container for buttons and other action elements.
 */
const PageSectionAside = ({ className, ...props }: PageSectionAsideProps) => {
  return (
    <div
      data-slot="page-section-aside"
      className={cn('flex items-center gap-2 shrink-0', className)}
      {...props}
    />
  )
}
PageSectionAside.displayName = 'PageSectionAside'

// ============================================================================
// Content
// ============================================================================

export type PageSectionContentProps = React.ComponentProps<'div'>

/**
 * Content component for page section.
 * Container for the main section content.
 */
const PageSectionContent = ({ className, ...props }: PageSectionContentProps) => {
  return <div data-slot="page-section-content" className={cn(className)} {...props} />
}
PageSectionContent.displayName = 'PageSectionContent'

// ============================================================================
// Compound Component
// ============================================================================

export type PageSectionProps = PageSectionRootProps

/**
 * Compound component for page section.
 * Use PageSection.Root, PageSection.Title, PageSection.Description, etc.
 */
export const PageSection = Object.assign(PageSectionRoot, {
  Root: PageSectionRoot,
  Summary: PageSectionSummary,
  Title: PageSectionTitle,
  Description: PageSectionDescription,
  Aside: PageSectionAside,
  Content: PageSectionContent,
})
