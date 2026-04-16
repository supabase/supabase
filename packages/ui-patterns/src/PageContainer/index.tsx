import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, HTMLAttributes } from 'react'
import { cn } from 'ui'

// ============================================================================
// Variants
// ============================================================================

const pageContainerVariants = cva(['mx-auto w-full @container px-6 xl:px-10'], {
  variants: {
    size: {
      small: 'max-w-[768px]',
      default: 'max-w-[1200px]',
      large: 'max-w-[1600px]',
      full: 'max-w-none',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

// ============================================================================
// Component
// ============================================================================

export type PageContainerProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof pageContainerVariants>

/**
 * Container component for page content.
 * Provides consistent max-width and padding based on size prop.
 *
 * @example
 * ```tsx
 * <PageContainer size="large">
 *   <PageHeader>
 *     <PageHeaderTitle>My Page</PageHeaderTitle>
 *   </PageHeader>
 *   {children}
 * </PageContainer>
 * ```
 */
export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, size, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn(pageContainerVariants({ size }), className)} />
  }
)

PageContainer.displayName = 'PageContainer'
