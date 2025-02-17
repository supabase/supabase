'use client'

import React, { forwardRef, useImperativeHandle } from 'react'
import { cn } from '../../lib/utils'
import { TextArea } from '../shadcn/ui/text-area'

export interface ExpandingTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /* The value of the textarea. Required to calculate the height of the textarea. */
  value: string
}

/**
 * This is a custom TextArea component that expands based on the content.
 */
const ExpandingTextArea = forwardRef<HTMLTextAreaElement, ExpandingTextAreaProps>(
  ({ className, value, ...props }, ref) => {
    const updateTextAreaHeight = (element: HTMLTextAreaElement | null) => {
      if (!element) return

      // Forward the ref to the parent component
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }

      // Update the height
      if (!value) {
        element.style.height = 'auto'
        element.style.minHeight = '36px'
      } else {
        element.style.height = 'auto'
        element.style.height = element.scrollHeight + 'px'
      }
    }

    return (
      <TextArea
        ref={updateTextAreaHeight}
        rows={1}
        aria-expanded={false}
        className={cn('h-auto resize-none box-border', className)}
        value={value}
        {...props}
      />
    )
  }
)

ExpandingTextArea.displayName = 'ExpandingTextArea'

export { ExpandingTextArea }
