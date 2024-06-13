import { Button } from 'ui'
import {
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipProvider_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'

export default function TooltipDemo() {
  return (
    <TooltipProvider_Shadcn_>
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <Button type="outline">Hover</Button>
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_>
          <p>Add to library</p>
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
    </TooltipProvider_Shadcn_>
  )
}
