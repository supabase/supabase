'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '../../lib/utils'
import { TextArea } from '../shadcn/ui/text-area'

export interface ExpandingTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /* The value of the textarea. Required to calculate the height of the textarea. */
  value: string
}

const MIN_TEXTAREA_HEIGHT = 100

/**
 * This is a custom TextArea component that expands based on the content.
 */
const ExpandingTextArea = forwardRef<HTMLTextAreaElement, ExpandingTextAreaProps>(
  ({ className, value, ...props }, ref) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    // Expose the ref to the parent component
    useImperativeHandle(ref, () => textAreaRef.current!)
    /**
     * This effect is used to resize the textarea based on the content
     */
    useEffect(() => {
      if (textAreaRef) {
        if (textAreaRef.current && !value) {
          textAreaRef.current.style.height = `${MIN_TEXTAREA_HEIGHT}px`
        } else if (textAreaRef && textAreaRef.current) {
          textAreaRef.current.style.height = 'auto'
          // the 1.001 is to prevent the textarea from randomly adding a scrollbar even though the calculation should
          // prevent that.
          const newHeight = Math.max(textAreaRef.current.scrollHeight * 1.001, MIN_TEXTAREA_HEIGHT)
          textAreaRef.current.style.height = `${newHeight}px`
        }
      }
    }, [value, textAreaRef])

    return (
      <TextArea
        ref={textAreaRef}
        // rows={1}
        // aria-expanded={false}
        className={cn('transition-all resize-none box-border', className)}
        value={value}
        {...props}
      />
    )
  }
)

ExpandingTextArea.displayName = 'ExpandingTextArea'

export { ExpandingTextArea }
