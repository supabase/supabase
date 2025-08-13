import { forwardRef, HTMLAttributes } from 'react'
import { cn } from 'ui'

export const MAX_WIDTH_CLASSES = 'mx-auto w-full max-w-[1200px]'
export const PADDING_CLASSES = 'px-4 @lg:px-6 @xl:px-12 @2xl:px-20 @3xl:px-24'
export const MAX_WIDTH_CLASSES_COLUMN = 'min-w-[420px]'

/**
 * Controls the width and padding of the UI contents. Typically used as the top level child immediately after a layout.
 *
 * e.g:```
 * <Layout>
 *  <ScaffoldContainer>
 *    {children}
 *  </ScaffoldContainer>
 * </Layout>```
 */
export const ScaffoldContainer = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    bottomPadding?: boolean
    size?: 'small' | 'default' | 'large' | 'full'
  }
>(({ className, bottomPadding, size = 'default', ...props }, ref) => {
  const maxWidthClass = {
    small: 'max-w-[768px]',
    default: 'max-w-[1200px]',
    large: 'max-w-[1600px]',
    full: 'max-w-none',
  }[size]

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'mx-auto w-full',
        maxWidthClass,
        PADDING_CLASSES,
        bottomPadding && 'pb-16',
        className
      )}
    />
  )
})

/**
 * Top most header for a page
 *
 * Note: In most cases, we won't use this directly in pages. Header title and description can be controlled via
 * the PageLayout component, which uses the PageHeader component, and in turn uses this ScaffoldHeader component
 */
export const ScaffoldHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <header {...props} ref={ref} className={cn('w-full', 'flex-col gap-3 py-6', className)} />
    )
  }
)

/**
 * Title for the top most header for a page
 *
 * Note: In most cases, we won't use this directly in pages. Header title and description can be controlled via
 * the PageLayout component, which uses the PageHeader component, and in turn uses this ScaffoldTitle component
 */
export const ScaffoldTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return <h1 ref={ref} {...props} className={cn(className)} />
  }
)

/**
 * Description for the top most header for a page
 *
 * Note: In most cases, we won't use this directly in pages. Header title and description can be controlled via
 * the PageLayout component, which uses the PageHeader component, and in turn uses this ScaffoldDescription component
 */
export const ScaffoldDescription = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} {...props} className={cn('text-sm text-foreground-light', className)} />
})

export const ScaffoldSection = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { isFullWidth?: boolean; topPadding?: boolean }
>(({ className, isFullWidth, topPadding, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'flex flex-col first:pt-12 py-6',
        isFullWidth ? 'w-full' : 'gap-3 lg:grid md:grid-cols-12',
        className
      )}
    />
  )
})

/**
 * Horizontal divider between ScaffoldSections
 */
export const ScaffoldDivider = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn('w-full h-px bg-border', className)} />
  }
)

/**
 * Title for a page section
 */
export const ScaffoldSectionTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return <h3 ref={ref} {...props} className={cn('text-foreground text-xl', className)} />
})

/**
 * Description for a page section
 */
export const ScaffoldSectionDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} {...props} className={cn('text-sm text-foreground-light', className)} />
})

/**
 * Child of ScaffoldSection - Left hand column for a section
 */
export const ScaffoldSectionDetail = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, title, ...props }, ref) => {
    return (
      <div ref={ref} {...props} className={cn('col-span-4 xl:col-span-5 prose text-sm', className)}>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    )
  }
)

/**
 * Child of ScaffoldSection - Right hand column for a section
 */
export const ScaffoldSectionContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn('col-span-8 xl:col-span-7', 'flex flex-col gap-6', className)}
      />
    )
  }
)

/**
 * TBD: Provide better JSDocs on how to use this component
 *
 * Table and filters
 */
export const ScaffoldFilterAndContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} {...props} className={cn('flex flex-col gap-3 items-center', className)} />
    )
  }
)

/**
 * TBD: Provide better JSDocs on how to use this component
 *
 * Actions Group
 */
export const ScaffoldActionsContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn('flex w-full items-center', className)} />
  }
)

/**
 * TBD: Provide better JSDocs on how to use this component
 *
 * Actions Group
 */
export const ScaffoldActionsGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn('flex flex-row gap-3', className)} />
  }
)

/**
 * For a single column section - currently only used for vercel integration
 */
export const ScaffoldColumn = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn('flex flex-col gap-3', MAX_WIDTH_CLASSES_COLUMN, className)}
      />
    )
  }
)

/**
 * For older layouts - eventually to be replaced with ScaffoldContainer component
 * @deprecated
 */
export const ScaffoldContainerLegacy = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(MAX_WIDTH_CLASSES, PADDING_CLASSES, 'my-8 flex flex-col gap-8', className)}
      />
    )
  }
)

ScaffoldHeader.displayName = 'ScaffoldHeader'
ScaffoldTitle.displayName = 'ScaffoldTitle'
ScaffoldDescription.displayName = 'ScaffoldDescription'
ScaffoldContainer.displayName = 'ScaffoldContainer'
ScaffoldDivider.displayName = 'ScaffoldDivider'
ScaffoldSection.displayName = 'ScaffoldSection'
ScaffoldColumn.displayName = 'ScaffoldColumn'
ScaffoldSectionDetail.displayName = 'ScaffoldSectionDetail'
ScaffoldSectionContent.displayName = 'ScaffoldSectionContent'
ScaffoldFilterAndContent.displayName = 'ScaffoldFilterAndContent'
ScaffoldActionsContainer.displayName = 'ScaffoldActionsContainer'
ScaffoldActionsGroup.displayName = 'ScaffoldActionsGroup'
ScaffoldContainerLegacy.displayName = 'ScaffoldContainerLegacy'
ScaffoldSectionTitle.displayName = 'ScaffoldSectionTitle'
ScaffoldSectionDescription.displayName = 'ScaffoldSectionDescription'
