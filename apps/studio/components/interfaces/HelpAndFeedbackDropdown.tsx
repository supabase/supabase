import { HelpCircle, LifeBuoy, Lightbulb } from 'lucide-react'
import { useState } from 'react'

import { FeedbackWidget } from 'components/layouts/ProjectLayout/LayoutHeader/FeedbackDropdown/FeedbackWidget'
import { HelpPopover } from 'components/layouts/ProjectLayout/LayoutHeader/HelpPopover'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

export const HelpAndFeedbackDropdown = () => {
  const [helpOpen, setHelpOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="border flex-shrink-0 px-3">
        <ButtonTooltip
          id="help-and-feedback-dropdown-button"
          type="text"
          className="rounded-none w-[32px] h-[30px] group"
          icon={
            <HelpCircle
              size={18}
              strokeWidth={1.5}
              className="!h-[18px] !w-[18px] text-foreground-light group-hover:text-foreground"
            />
          }
          tooltip={{ content: { side: 'bottom', text: 'Help' } }}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end">
        {/* <div className="px-2 py-1 flex flex-col gap-0 text-sm">
          <span className="w-full text-left text-foreground truncate">Help and feedback</span>
        </div>
        <DropdownMenuSeparator /> */}
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex gap-2" onClick={() => setHelpOpen(true)}>
            <LifeBuoy size={14} strokeWidth={1.5} className="text-foreground-lighter" />
            Get support
          </DropdownMenuItem>
          <DropdownMenuItem className="flex gap-2" onClick={() => setFeedbackOpen(true)}>
            <Lightbulb size={14} strokeWidth={1.5} className="text-foreground-lighter" />
            Leave feedback
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
      <HelpPopover open={helpOpen} onOpenChange={setHelpOpen} />
      <FeedbackWidget open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </DropdownMenu>
  )
}
