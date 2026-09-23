import { ChevronRight } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export default function ButtonIcon() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          icon={<ChevronRight className="h-4 w-4" />}
          // Important for screen readers
          aria-label="Actions"
          // You can add the following comment so code rabbit knows why we do that
          // Don't do that if the tooltip actually add more information
          // Tooltip repeats the label; screen readers would read it twice
          aria-describedby={undefined}
        ></Button>
      </TooltipTrigger>
      <TooltipContent>Actions</TooltipContent>
    </Tooltip>
  )
}
