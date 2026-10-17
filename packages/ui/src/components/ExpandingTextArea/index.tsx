'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'

import { cn } from '../../lib/utils'
import { Textarea } from '../shadcn/ui/textarea'

export interface ExpandingTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /* The value of the textarea. Required to calculate the height of the textarea. */
  value: string
}

/**
 * This is a custom TextArea component that expands based on the content.
 */
const ExpandingTextArea = forwardRef<HTMLTextAreaElement | null, ExpandingTextAreaProps>(
  ({ className, value, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement, [])

    const updateTextAreaHeight = () => {
      const element = internalRef.current
      if (!element) return

      // Match single-line input height (h-10 = 40px) so we don't shrink when typing; grow only when content wraps
      const singleLineHeightPx = 40
      element.style.height = 'auto'
      const contentHeight = element.scrollHeight
      element.style.height = Math.max(singleLineHeightPx, contentHeight) + 'px'
    }

    useLayoutEffect(() => {
      updateTextAreaHeight()
    }, [value])

    useEffect(() => {
      const element = internalRef.current
      if (!element) return

      // A measurement taken right on mount can catch the element mid-layout (e.g. while
      // an ancestor panel is still settling its width), baking in a wrong height that
      // never gets corrected since the effect above only reruns on `value` changes.
      // Re-measure whenever the element's own box actually changes size.
      const observer = new ResizeObserver(() => updateTextAreaHeight())
      observer.observe(element)
      return () => observer.disconnect()
    }, [])

    return (
      <Textarea
        ref={(element) => {
          internalRef.current = element
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
