import { useState } from 'react'

import { Button, PopoverContent, PopoverTrigger, Popover } from 'ui'
import { FeedbackWidget } from './FeedbackWidget'

export const FeedbackDropdown = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover
      modal={false}
      open={isOpen}
      onOpenChange={(e) => {
        setIsOpen(e)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          asChild
          onClick={() => {
            setIsOpen((isOpen) => !isOpen)
          }}
          type="text"
          className="rounded-full h-[32px] text-foreground-light hover:text-foreground"
        >
          <span className={className}>Feedback</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="p-0 flex flex-col w-[22rem]"
        id="feedback-widget"
      >
        <FeedbackWidget onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
