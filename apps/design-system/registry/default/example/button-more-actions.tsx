import { CircleStop, EllipsisVertical, Plus } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'

function MoreActions({ label, actions }: { label: string; actions: string[] }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              className="w-6.5"
              icon={<EllipsisVertical />}
              aria-label={label}
              aria-describedby={undefined}
            />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action}>{action}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ButtonMoreActionsDemo() {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <MoreActions label="More pipeline list actions" actions={['Pipeline settings']} />
          <Button type="button" variant="primary" icon={<Plus />}>
            Add pipeline
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" icon={<CircleStop />}>
            Stop
          </Button>
          <MoreActions
            label="More actions for this pipeline"
            actions={['View logs', 'Edit pipeline']}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
