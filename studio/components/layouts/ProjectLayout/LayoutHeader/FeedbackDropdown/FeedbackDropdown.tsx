import { useState } from 'react'
import { Transition } from '@headlessui/react'
import { Button, IconMessageCircle } from '@supabase/ui'

import { clickOutsideListener } from 'hooks'
import FeedbackWidget from './FeedbackWidget'

const FeedbackDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState('Feedback')

  const clickContainerRef = clickOutsideListener(() => {
    if (isOpen) setIsOpen(false)
  })

  function onOpen() {
    setIsOpen((isOpen) => !isOpen)
  }

  return (
    <div ref={clickContainerRef} className="relative inline-block text-left mr-1">
      <div>
        <Button
          onClick={onOpen}
          type="default"
          icon={<IconMessageCircle size={16} strokeWidth={2} />}
        >
          <span className="block md:hidden">Feedback</span>
          <span className="hidden md:block">Feedback on this page?</span>
        </Button>
      </div>
      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <FeedbackWidget
          onClose={() => setIsOpen(false)}
          setFeedback={setFeedback}
          feedback={feedback}
          category={category}
          setCategory={setCategory}
        />
      </Transition>
    </div>
  )
}

export default FeedbackDropdown
