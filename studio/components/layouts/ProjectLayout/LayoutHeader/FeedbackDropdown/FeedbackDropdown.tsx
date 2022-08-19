import { useState } from 'react'
import { Button, IconMessageCircle, Popover } from '@supabase/ui'
import FeedbackWidget from './FeedbackWidget'

const FeedbackDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)

  function onOpen() {
    setIsOpen((isOpen) => !isOpen)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e)}
      size="content"
      side="bottom"
      align="end"
      overlay={<FeedbackWidget onClose={() => setIsOpen(false)} />}
    >
      <Button
        as="span"
        onClick={onOpen}
        type="default"
        icon={<IconMessageCircle size={16} strokeWidth={1.5} className="text-scale-900" />}
      >
        <span className="block md:hidden">Feedback</span>
        <span className="hidden md:block">Feedback on this page?</span>
      </Button>
    </Popover>
  )
}

export default FeedbackDropdown
