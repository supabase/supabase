import { useState } from 'react'

import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'
import FeedbackWidget from './FeedbackWidget'

const FeedbackDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [screenshot, setScreenshot] = useState<string>()

  return (
    <Popover_Shadcn_
      modal={false}
      open={isOpen}
      onOpenChange={(e) => {
        setIsOpen(e)
        if (!e) setScreenshot(undefined)
      }}
    >
      <PopoverTrigger_Shadcn_ asChild>
        <Button asChild onClick={() => setIsOpen((isOpen) => !isOpen)} type="outline">
          <span className="hidden md:flex">Feedback</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        side="bottom"
        align="end"
        className="px-0 flex flex-col pt-1 pb-3 gap-3 w-96"
        id="feedback-widget"
      >
        <FeedbackWidget
          onClose={() => setIsOpen(false)}
          feedback={feedback}
          setFeedback={setFeedback}
          screenshot={screenshot}
          setScreenshot={setScreenshot}
        />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default FeedbackDropdown
