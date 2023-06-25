import { Meta } from '@storybook/react'
import { Button } from '@ui/components/shadcn/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ui/components/shadcn/ui/tooltip'

const meta: Meta = {
  title: 'shadcn/Tooltip',
  component: Tooltip,
}

export function Default() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default meta
