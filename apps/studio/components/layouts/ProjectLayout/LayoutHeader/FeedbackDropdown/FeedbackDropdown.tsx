import { Lightbulb, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'
import { FeedbackWidget } from './FeedbackWidget'

export const FeedbackDropdown = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<'select' | 'widget'>('select')

  return (
    <Popover_Shadcn_
      modal={false}
      open={isOpen}
      onOpenChange={(e) => {
        setIsOpen(e)
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
          type="text"
          className="rounded-full h-[32px] text-foreground-light hover:text-foreground"
        >
          <span className={className}>Feedback</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        side="bottom"
        align="end"
        className="p-0 flex flex-col w-96"
        id="feedback-widget"
      >
        {stage === 'select' && (
          <div className="flex flex-col gap-4 p-4">
            <div className="font-medium text-sm">What would you like to share?</div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="default" className="h-32" onClick={() => setIsOpen(false)} asChild>
                <SupportLink>
                  <div className="grid gap-1.5 text-center">
                    <TriangleAlert size="28" className="mx-auto text-destructive-600" />
                    <div className="flex flex-col items-center">
                      <span className="text-base">Issue</span>
                      <span className="text-xm text-foreground-lighter">with my project</span>
                    </div>
                  </div>
                </SupportLink>
              </Button>
              <Button type="default" className="h-32" onClick={() => setStage('widget')}>
                <div className="grid gap-1.5 text-center">
                  <Lightbulb size="28" className="mx-auto text-warning" />
                  <div className="flex flex-col items-center">
                    <span className="text-base">Idea</span>
                    <span className="text-xm text-foreground-lighter">to improve Supabase</span>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}
        {stage === 'widget' && <FeedbackWidget onClose={() => setIsOpen(false)} />}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
