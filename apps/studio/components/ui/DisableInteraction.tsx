import React, { forwardRef } from 'react'
import { cn } from 'ui'

interface DisableInteractionProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
}

/**
 * DisableInteraction component
 *
 * A utility component that wraps content and prevents all user interactions when disabled
 * including clicking, hovering, and text selection.
 *
 * @example
 * <DisableInteraction disabled={isDisabled}>
 *   <YourContent />
 * </DisableInteraction>
 */
export const DisableInteraction = forwardRef<HTMLDivElement, DisableInteractionProps>(
  ({ disabled, style, className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn(disabled && 'opacity-50 pointer-events-none', className)}
      style={{
        ...(disabled && {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }),
        ...style,
      }}
    />
  )
)

DisableInteraction.displayName = 'DisableInteraction'
