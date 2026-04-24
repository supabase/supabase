'use client'

import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'

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
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement, [])

    const updateTextAreaHeight = (element: HTMLTextAreaElement | null) => {
      if (!element) return

      // Match single-line input height (h-10 = 40px) so we don't shrink when typing; grow only when content wraps
      const singleLineHeightPx = 40
      element.style.height = 'auto'
      const contentHeight = element.scrollHeight
      element.style.height = Math.max(singleLineHeightPx, contentHeight) + 'px'
    }

    useLayoutEffect(() => {
      updateTextAreaHeight(internalRef.current)
    }, [value])

    return (
      <TextArea
        ref={(element) => {
          if (element) {
            internalRef.current = element
            updateTextAreaHeight(element)
          }
        }}
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
