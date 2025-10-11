'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { cn } from '../../lib/utils'
import { TextArea } from '../shadcn/ui/text-area'

export interface ExpandingTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /* The value of the textarea. Required to calculate the height of the textarea. */
  value: string
}

/**
 * A textarea component that automatically expands its height to fit the content.
 * @param {object} props - The component props.
 * @param {string} props.value - The value of the textarea. This is required to calculate the height.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {React.ReactElement} The expanding textarea component.
 */
const ExpandingTextArea = forwardRef<HTMLTextAreaElement, ExpandingTextAreaProps>(
  ({ className, value, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement, [])

    const updateTextAreaHeight = (element: HTMLTextAreaElement | null) => {
      if (!element) return

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
