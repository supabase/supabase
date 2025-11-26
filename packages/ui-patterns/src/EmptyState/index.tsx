import type { LucideIcon } from 'lucide-react'
import { createElement, isValidElement, ReactNode } from 'react'

import { cn } from 'ui'

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode
  title: string
  description?: string | ReactNode
  children?: ReactNode
  className?: string
  iconSize?: number
  iconClassName?: string
  contentClassName?: string
}

/**
 * EmptyState component for displaying empty states with icons, titles, descriptions, and optional actions.
 *
 * Supports both Lucide icons (component types) and custom ReactNode icons (like forwardRef components from 'icons' package).
 * Automatically handles rendering icons whether they're passed as component types or pre-rendered elements.
 *
 * @example
 * ```tsx
 * // With Lucide icon component type
 * <EmptyState
 *   icon={DatabaseBackup}
 *   title="No backups yet"
 *   description="Check again tomorrow."
 * />
 *
 * // With custom icon element
 * <EmptyState
 *   icon={<Loader2 className="animate-spin" />}
 *   title="Loading..."
 *   description="Please wait"
 * />
 *
 * // With action button
 * <EmptyState
 *   icon={BucketPlus}
 *   title="Create a vector bucket"
 *   description="Store, index, and query your vector embeddings at scale."
 * >
 *   <Button>Create bucket</Button>
 * </EmptyState>
 * ```
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  children,
  className,
  iconSize = 24,
  iconClassName,
  contentClassName,
}: EmptyStateProps) => {
  // Extract content rendering to avoid duplication between icon and no-icon cases
  const textContent = (
    <div className={cn('flex flex-col items-center text-center text-balance', contentClassName)}>
      <h3>{title}</h3>
      {description && <p className="text-foreground-light text-sm max-w-[640px]">{description}</p>}
    </div>
  )

  return (
    <aside
      className={cn(
        'border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col items-center gap-y-3',
        className
      )}
    >
      {Icon ? (
        <div className="flex flex-col gap-y-3 items-center">
          {/* 
            Handle different icon types:
            1. If it's already a React element (pre-rendered), render it directly
            2. If it's a function (LucideIcon component type) or forwardRef component (has $$typeof),
               instantiate it with createElement and apply default props
            3. Otherwise, render as-is (fallback for other ReactNode types)
          */}
          {isValidElement(Icon)
            ? Icon
            : typeof Icon === 'function' ||
                (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon)
              ? createElement(Icon as LucideIcon, {
                  size: iconSize,
                  strokeWidth: 1.5,
                  className: cn('text-foreground-muted', iconClassName),
                })
              : Icon}
          {textContent}
        </div>
      ) : (
        textContent
      )}

      {/* Optional children (typically action buttons) */}
      {children}
    </aside>
  )
}
