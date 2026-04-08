import type { ReactElement } from 'react'
import { cn, Popover_Shadcn_, PopoverAnchor_Shadcn_, PopoverContent_Shadcn_ } from 'ui'

import { ProjectBranchSelectorPopover } from './ProjectBranchSelectorPopover'

export interface ProjectBranchSelectorOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  showOrganizationColumn: boolean
  /** Element that anchors the popover (typically a button). */
  anchor: ReactElement
}

export function ProjectBranchSelectorOverlay({
  open,
  onOpenChange,
  showOrganizationColumn,
  anchor,
}: ProjectBranchSelectorOverlayProps) {
  return (
    <Popover_Shadcn_ open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverAnchor_Shadcn_ asChild>{anchor}</PopoverAnchor_Shadcn_>
      <PopoverContent_Shadcn_
        className={cn(
          'p-0 max-w-[calc(100vw-1rem)]',
          showOrganizationColumn ? 'w-[min(100vw-1rem,780px)]' : 'w-[min(100vw-1rem,520px)]'
        )}
        side="bottom"
        align="start"
      >
        <ProjectBranchSelectorPopover
          showOrganizationColumn={showOrganizationColumn}
          onClose={() => onOpenChange(false)}
        />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
