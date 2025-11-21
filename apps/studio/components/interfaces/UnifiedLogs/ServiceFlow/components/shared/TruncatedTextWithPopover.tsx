import { useState } from 'react'

import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

interface TruncatedTextWithPopoverProps {
  text: string
  maxLength?: number
  className?: string
  children?: React.ReactNode
}

export const TruncatedTextWithPopover = ({
  text,
  maxLength = 50,
  className = '',
  children,
}: TruncatedTextWithPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const isTruncated = text.length > maxLength
  const truncatedText = isTruncated ? text.substring(0, maxLength) + '...' : text

  // If not truncated, just render the text without popover
  if (!isTruncated) {
    return children ? <>{children}</> : <span className={className}>{text}</span>
  }

  // If truncated, render with popover
  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <span className={`cursor-help ${className}`}>{children || truncatedText}</span>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="max-w-md p-3 break-words" side="top">
        <div className="text-sm font-mono whitespace-pre-wrap">{text}</div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
