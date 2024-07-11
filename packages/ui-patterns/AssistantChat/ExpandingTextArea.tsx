'use client'

import React, { createRef, useEffect } from 'react'
import { TextArea } from 'ui/src/components/shadcn/ui/text-area'
import { cn } from 'ui/src/lib/utils'

export interface ExpandingTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ExpandingTextArea = ({
  className,
  disabled = false,
  value,
  onSubmit,
  placeholder,
  ...props
}: ExpandingTextAreaProps) => {
  const textAreaRef = createRef<HTMLTextAreaElement>()

  /**
   * This effect is used to resize the textarea based on the content
   */
  useEffect(() => {
    if (textAreaRef) {
      if (!value && textAreaRef && textAreaRef.current) {
        textAreaRef.current.style.height = '40px'
      } else if (textAreaRef && textAreaRef.current) {
        const newHeight = textAreaRef.current.scrollHeight + 'px'
        textAreaRef.current.style.height = newHeight
      }
    }
  }, [value, textAreaRef])

  return (
    <TextArea
      ref={textAreaRef}
      rows={1}
      contentEditable
      aria-expanded={false}
      className={cn(
        'transition-all text-sm pr-10 rounded-[18px] resize-none box-border leading-6',
        className
      )}
      placeholder={placeholder}
      spellCheck={false}
      value={value}
      {...props}
    />
  )
}

ExpandingTextArea.displayName = 'AssistantChatTextArea'

export { ExpandingTextArea }
