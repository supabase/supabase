import { useState } from 'react'
import { Button, IconMessageCircle, Popover } from 'ui'
import FeedbackWidget from './FeedbackWidget'

interface FeedbackDropdownProps {
  alt?: boolean
}

const FeedbackDropdown = ({ alt = false }: FeedbackDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [screenshot, setScreenshot] = useState<string>()

  function onOpen() {
    setIsOpen((isOpen) => !isOpen)
  }

  function onClose() {
    setFeedback('')
    setScreenshot(undefined)
    setIsOpen(false)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(e) => {
        setIsOpen(e)
        if (!e) setScreenshot(undefined)
      }}
      size="content"
      side="bottom"
      align="end"
      overlay={
        <FeedbackWidget
          onClose={onClose}
          feedback={feedback}
          setFeedback={setFeedback}
          screenshot={screenshot}
          setScreenshot={setScreenshot}
        />
      }
    >
      <Button
        asChild
        onClick={onOpen}
        type="default"
        icon={
          alt ? null : <IconMessageCircle size={16} strokeWidth={1.5} className="text-scale-900" />
        }
      >
        <span className="hidden md:flex">Feedback</span>
      </Button>
    </Popover>
  )
}

export default FeedbackDropdown
