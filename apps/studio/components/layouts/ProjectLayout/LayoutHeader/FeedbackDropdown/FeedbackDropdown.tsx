import { Lightbulb, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'
import { FeedbackWidget } from './FeedbackWidget'

const FeedbackDropdown = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [screenshot, setScreenshot] = useState<string>()
  const [stage, setStage] = useState<'select' | 'widget'>('select')

  return (
    <Popover_Shadcn_
      modal={false}
      open={isOpen}
      onOpenChange={(e) => {
        setIsOpen(e)
        if (!e) setScreenshot(undefined)
        if (!e) setStage('select')
      }}
    >
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          asChild
          onClick={() => {
            setIsOpen((isOpen) => !isOpen)
            setStage('select')
          }}
          type="outline"
          className="rounded-full h-[32px] border-border"
        >
          <span className={className}>Feedback</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        side="bottom"
        align="end"
        className="px-0 flex flex-col pt-1 pb-3 w-96"
        id="feedback-widget"
      >
        {stage === 'select' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="font-medium text-sm">What would you like to share?</div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="default" className="h-32" onClick={() => setIsOpen(false)} asChild>
                <Link href="/support/new">
                  <span className="grid gap-1 text-center">
                    <TriangleAlert size="28" className="mx-auto text-destructive-600" />
                    <span className="text-base">Issue</span>
                    <span className="text-xm text-foreground-lighter">with my project</span>
                  </span>
                </Link>
              </Button>
              <Button type="default" className="h-32" onClick={() => setStage('widget')}>
                <span className="grid gap-1 text-center">
                  <Lightbulb size="28" className="mx-auto text-warning" />
                  <span className="text-base">Idea</span>
                  <span className="text-xm text-foreground-lighter">to improve Supabase</span>
                </span>
              </Button>
            </div>
          </div>
        )}
        {stage === 'widget' && (
          <FeedbackWidget
            onClose={() => setIsOpen(false)}
            feedback={feedback}
            setFeedback={setFeedback}
            screenshot={screenshot}
            setScreenshot={setScreenshot}
          />
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default FeedbackDropdown
