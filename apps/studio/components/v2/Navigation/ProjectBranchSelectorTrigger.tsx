import { ChevronsUpDown, GitBranch } from 'lucide-react'
import * as React from 'react'
import type { Organization } from 'types'
import {
  cn,
  SidebarMenuButton as SidebarMenuButtonComponent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

export interface ProjectBranchSelectorTriggerProps {
  displayProjectName: string
  selectedOrg?: Organization
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
>(
  (
    {
      displayProjectName,
      selectedOrg,
      isBranch,
      isProductionBranch: _isProductionBranch,
      branchDisplayName,
      onGoToOrganization: _onGoToOrganization,
      ...buttonProps
    },
    ref
  ) => {
    const selectedOrgInitial = selectedOrg?.name?.trim().charAt(0).toUpperCase() ?? 'O'

    return (
      <SidebarMenuButtonComponent
        ref={ref}
        size="lg"
        className="group px-1 py-0.5 gap-1.5 w-full max-w-[250px] flex h-auto text-left data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground touch-manipulation"
        {...buttonProps}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex h-7 aspect-square shrink-0 items-center bg-background-muted group-hover:border-stronger justify-center rounded border border-strong text-xs">
              {selectedOrgInitial}
            </div>
          </TooltipTrigger>
          <TooltipContent>{selectedOrg?.name ?? 'No Organization selected'}</TooltipContent>
        </Tooltip>
        <div className="text-left flex-grow min-w-0">
          <div className="w-full truncate text-foreground leading-tight">{displayProjectName}</div>
          <div
            className={cn(
              'flex items-center gap-0.5',
              isBranch ? 'text-foreground-lighter' : 'text-warning'
            )}
          >
            <GitBranch className="shrink-0 size-3" strokeWidth={1.5} />
            <span className="truncate min-w-0 leading-tight text-[11px]">{branchDisplayName}</span>
          </div>
        </div>

        <ChevronsUpDown
          strokeWidth={1.5}
          className="ml-auto text-foreground-lighter !w-4 !h-4 md:hidden md:group-hover:flex"
        />
      </SidebarMenuButtonComponent>
    )
  }
)
ProjectBranchSelectorTrigger.displayName = 'ProjectBranchSelectorTrigger'
