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
  VariantProps<typeof pageSectionRootVariants>

/**
 * Root component for page section.
 * Provides layout structure for section content with orientation variants.
 * Renders children in order without searching for specific components.
 */
const PageSectionRoot = ({
  className,
  orientation = 'vertical',
  children,
  ...props
}: PageSectionRootProps) => {
  return (
    <div
      data-slot="page-section"
      data-orientation={orientation}
      className={cn(pageSectionRootVariants({ orientation }), className)}
      {...props}
    >
      {children}
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
 * Should be placed inside PageSectionMeta.
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
      // Optically align with bottom of PageSectionAside
      // trim-end is not available in Tailwind CSS
      style={
        {
          textBoxTrim: 'trim-end',
        } as React.CSSProperties
      }
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
 * Should be placed inside PageSectionMeta.
 */
const PageSectionAside = ({ className, ...props }: PageSectionAsideProps) => {
  return (
    <div
      data-slot="page-section-aside"
      className={cn(
        'flex items-center gap-2',
        // Align with bottom of PageSectionDescription
        '@xl:self-end',
        className
      )}
      {...props}
    />
  )
}
PageSectionAside.displayName = 'PageSectionAside'

// ============================================================================
// Meta
// ============================================================================

export type PageSectionMetaProps = React.ComponentProps<'div'>

/**
 * Meta wrapper for page section.
 * Contains summary and aside components with proper layout.
 * Should be placed as the first child of PageSectionRoot.
 * Uses CSS to style children based on their data-slot attributes.
 */
const PageSectionMeta = ({ className, children, ...props }: PageSectionMetaProps) => {
  return (
    <div className="@container">
      <div
        data-slot="page-section-meta"
        className={cn(
          'flex flex-col @xl:flex-row @xl:justify-between @xl:items-center gap-4',
          '[&>[data-slot="page-section-summary"]]:flex-1',
          // Center alignment with PageSectionAside in case no PageSectionDescription present
          '[&>[data-slot="page-section-summary"]]:@xl:self-center',
          '[&>[data-slot="page-section-aside"]]:shrink-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}
PageSectionMeta.displayName = 'PageSectionMeta'

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
// Exports
// ============================================================================

export type PageSectionProps = PageSectionRootProps

/**
 * Page section root component.
 * Use PageSection, PageSectionMeta, PageSectionSummary, etc.
 */
export {
  PageSectionRoot as PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
}
