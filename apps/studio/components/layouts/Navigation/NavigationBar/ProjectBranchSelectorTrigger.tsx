import { ChevronsUpDown, GitBranch } from 'lucide-react'
import * as React from 'react'
import {
  cn,
  SidebarMenuButton as SidebarMenuButtonComponent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { getSelectedOrgInitial } from './ProjectBranchSelector.utils'
import type { Organization } from '@/types'

export interface ProjectBranchSelectorTriggerProps {
  displayProjectName: string
  selectedOrg: Organization
  isBranch: boolean
  isProductionBranch: boolean
  branchDisplayName: string
  onGoToOrganization: () => void
}

export const ProjectBranchSelectorTrigger = React.forwardRef<
  React.ElementRef<typeof SidebarMenuButtonComponent>,
  ProjectBranchSelectorTriggerProps &
    Omit<
      React.ComponentPropsWithoutRef<typeof SidebarMenuButtonComponent>,
      keyof ProjectBranchSelectorTriggerProps
    >
>(({ displayProjectName, selectedOrg, isBranch, branchDisplayName, ...buttonProps }, ref) => {
  const selectedOrgInitial = getSelectedOrgInitial(selectedOrg?.name ?? 'O')

  return (
    <SidebarMenuButtonComponent
      ref={ref}
      size="lg"
      className="group py-1 gap-1.5 w-full flex h-auto text-left data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground touch-manipulation"
      {...buttonProps}
    >
      <Tooltip>
        <TooltipTrigger>
          <div className="relative flex h-8 aspect-square shrink-0 items-center bg-background-muted group-hover:border-stronger justify-center rounded border border-strong text-xs">
            {selectedOrgInitial}
          </div>
        </TooltipTrigger>
        <TooltipContent>{selectedOrg?.name}</TooltipContent>
      </Tooltip>
      <div className="text-left flex-grow min-w-0">
        <div className="text-left flex-grow min-w-0">
          <div className="w-full truncate text-foreground leading-tight max-w-[250px]">
            {displayProjectName}
          </div>
          <div
            className={cn(
              'flex items-center gap-0.5',
              isBranch ? 'text-foreground-lighter' : 'text-warning'
            )}
          >
            <GitBranch className="shrink-0 size-3" strokeWidth={1.5} />
            <span className="truncate min-w-0 leading-tight text-xs">{branchDisplayName}</span>
          </div>
        </div>
      </div>

      <ChevronsUpDown
        strokeWidth={1.5}
        className="ml-auto text-foreground-lighter !w-4 !h-4 md:hidden md:group-hover:flex"
      />
    </SidebarMenuButtonComponent>
  )
})
ProjectBranchSelectorTrigger.displayName = 'ProjectBranchSelectorTrigger'
