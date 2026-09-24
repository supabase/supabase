import { ExternalLink } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export default function ButtonIcon() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          icon={<ExternalLink />}
          // Match tooltip content for screen readers
          aria-label="View logs"
          // Tooltip repeats the label; clear describedby so screen readers don't hear it twice
          // Skip this if the tooltip adds information beyond the label
          aria-describedby={undefined}
          // Square off the tiny button (h-[26px]) and increase the tap target
          className="hit-area-2 w-6.5"
        ></Button>
      </TooltipTrigger>
      <TooltipContent>View logs</TooltipContent>
    </Tooltip>
  )
}
