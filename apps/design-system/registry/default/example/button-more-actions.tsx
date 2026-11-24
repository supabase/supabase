import { CircleStop, Edit, EllipsisVertical, Plus, RotateCcw, Trash } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'

function MoreActions({ label, children }: { label: string; children: ReactNode }) {
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
      <DropdownMenuContent align="end" className="w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ButtonMoreActionsDemo() {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-10">
        <div className="flex items-center gap-2">
          <MoreActions label="More pipeline list actions">
            <DropdownMenuItem>Pipelines usage</DropdownMenuItem>
            <DropdownMenuItem>Pipelines settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Disable Pipelines</DropdownMenuItem>
          </MoreActions>
          <Button type="button" variant="primary" icon={<Plus />}>
            Add pipeline
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" icon={<CircleStop />}>
            Stop
          </Button>
          <MoreActions label="More actions for this pipeline">
            <DropdownMenuItem className="gap-x-2">
              <RotateCcw size={14} aria-hidden="true" />
              Restart pipeline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-x-2">
              <Edit size={14} aria-hidden="true" />
              Edit pipeline
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-x-2">
              <Trash size={14} aria-hidden="true" />
              Delete pipeline
            </DropdownMenuItem>
          </MoreActions>
        </div>
      </div>
    </TooltipProvider>
  )
}
