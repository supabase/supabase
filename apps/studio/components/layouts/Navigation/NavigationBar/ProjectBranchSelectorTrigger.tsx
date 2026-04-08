import { ChevronsUpDown, GitBranch } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'
import {
  Badge,
  cn,
  Popover_Shadcn_,
  PopoverAnchor_Shadcn_,
  PopoverContent_Shadcn_,
  SidebarMenuButton as SidebarMenuButtonComponent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { getSelectedOrgInitial } from './ProjectBranchSelector.utils'
import { ProjectBranchSelectorOverlay } from './ProjectBranchSelectorOverlay'
import { OrganizationDropdown } from '@/components/layouts/AppLayout/OrganizationDropdown'
import type { Organization } from '@/types'

export interface ProjectBranchSelectorTriggerBaseProps {
  displayProjectName: string
  selectedOrg: Organization | undefined
  isBranch: boolean
  isProductionBranch: boolean
  branchDisplayName: string
  onGoToOrganization: () => void
  isCollapsed?: boolean
}

type ProjectBranchSelectorTriggerUnifiedProps = ProjectBranchSelectorTriggerBaseProps &
  Omit<
    React.ComponentPropsWithoutRef<typeof SidebarMenuButtonComponent>,
    keyof ProjectBranchSelectorTriggerBaseProps | 'interactionMode' | 'onProjectHome'
  > & {
    interactionMode?: 'unified'
  }

type ProjectBranchSelectorTriggerSplitProps = ProjectBranchSelectorTriggerBaseProps & {
  interactionMode: 'split-desktop'
  onProjectHome: () => void
  className?: string
}

export type ProjectBranchSelectorTriggerProps =
  | ProjectBranchSelectorTriggerUnifiedProps
  | ProjectBranchSelectorTriggerSplitProps

const splitRowClassName =
  'group/project-branch-selector flex h-auto min-h-9 w-full touch-manipulation items-center gap-1.5 py-0 pl-0'

const orgButtonClassName =
  'relative flex h-8 aspect-square shrink-0 items-center justify-center rounded border border-strong bg-background-muted text-xs outline-none ring-sidebar-ring transition-[color,box-shadow] hover:border-stronger focus-visible:ring-2'

const projectBranchButtonClassName =
  'min-w-0 flex-1 cursor-pointer rounded-md px-0 py-0.5 text-left text-sm outline-none ring-sidebar-ring transition-[color,box-shadow] focus-visible:ring-2'

const chevronButtonClassName =
  'cursor-pointer rounded-md p-1 outline-none ring-sidebar-ring transition-[color,box-shadow] hover:bg-surface-200 focus-visible:ring-2 hover:!bg-selection group-hover:bg-surface-200 group-hover:text-foreground'

export const ProjectBranchSelectorTrigger = React.forwardRef<
  HTMLButtonElement,
  ProjectBranchSelectorTriggerProps
>((props, ref) => {
  if (props.interactionMode === 'split-desktop') {
    const {
      displayProjectName,
      selectedOrg,
      isBranch,
      branchDisplayName,
      onProjectHome,
      className,
    } = props

    const selectedOrgInitial = getSelectedOrgInitial(selectedOrg?.name ?? 'O')
    const [orgOpen, setOrgOpen] = useState(false)
    const [branchOpen, setBranchOpen] = useState(false)

    const handleOrgOpenChange = (open: boolean) => {
      setOrgOpen(open)
      if (open) setBranchOpen(false)
    }

    const handleBranchOpenChange = (open: boolean) => {
      setBranchOpen(open)
      if (open) setOrgOpen(false)
    }

    return (
      <div className={cn(splitRowClassName, className)}>
        <Popover_Shadcn_ open={orgOpen} onOpenChange={handleOrgOpenChange} modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverAnchor_Shadcn_ asChild>
                <button
                  type="button"
                  className={orgButtonClassName}
                  aria-label="Select organization"
                  onClick={() => handleOrgOpenChange(true)}
                >
                  {selectedOrgInitial}
                </button>
              </PopoverAnchor_Shadcn_>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col max-w-60 bg-overlay py-1 px-2">
              <div className="text-xs text-foreground-light flex flex-wrap items-center gap-1">
                <span className="text-sm text-foreground-light truncate">{selectedOrg?.name}</span>
                <div>
                  {!!selectedOrg && <Badge variant="default">{selectedOrg?.plan.name}</Badge>}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
            <OrganizationDropdown
              renderCommandContentOnly
              onClose={() => handleOrgOpenChange(false)}
            />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>

        <button
          type="button"
          className={projectBranchButtonClassName}
          onClick={onProjectHome}
          aria-label={`Open project ${displayProjectName}`}
        >
          <div className="min-w-0 flex-1 text-left">
            <div
              title={displayProjectName}
              className={cn(
                'w-full max-w-[250px] truncate leading-tight text-foreground-light transition-colors group-hover/project-branch-selector:text-foreground'
              )}
            >
              {displayProjectName}
            </div>
            <div
              title={branchDisplayName}
              className={cn(
                'flex items-center gap-0.5 text-xs',
                isBranch
                  ? 'text-foreground-lighter group-hover/project-branch-selector:text-foreground-light'
                  : 'text-warning'
              )}
            >
              <GitBranch className="size-3 shrink-0" strokeWidth={1.5} />
              <span className="min-w-0 truncate text-xs leading-tight">{branchDisplayName}</span>
            </div>
          </div>
        </button>

        <ProjectBranchSelectorOverlay
          open={branchOpen}
          onOpenChange={handleBranchOpenChange}
          showOrganizationColumn={false}
          anchor={
            <button
              type="button"
              className={chevronButtonClassName}
              aria-label="Select project or branch"
              onClick={() => handleBranchOpenChange(true)}
            >
              <ChevronsUpDown
                strokeWidth={1.5}
                className="ml-auto !h-4 !w-4 text-foreground-lighter group-hover:text-foreground-light"
              />
            </button>
          }
        />
      </div>
    )
  }

  const {
    displayProjectName,
    selectedOrg,
    isBranch,
    branchDisplayName,
    isCollapsed,
    className,
    interactionMode: _interactionMode,
    ...buttonProps
  } = props

  const selectedOrgInitial = getSelectedOrgInitial(selectedOrg?.name ?? 'O')

  const collapsedTooltipContent = isCollapsed ? (
    <div className="flex min-w-[120px] max-w-[250px] items-center gap-1 pr-1 text-left text-xs text-foreground">
      <div className="relative flex aspect-square h-8 shrink-0 items-center justify-center rounded border border-strong bg-background-muted text-xs">
        {selectedOrgInitial}
      </div>
      <div className="min-w-0 flex-1 text-left flex flex-col justify-center h-full">
        <div className="w-full truncate leading-tight">{displayProjectName}</div>
        <div
          className={cn(
            'flex items-center gap-0.5',
            isBranch ? 'text-foreground-lighter' : 'text-warning'
          )}
        >
          <GitBranch className="size-3 shrink-0" strokeWidth={1.5} />
          <span className="min-w-0 truncate text-xs leading-tight">{branchDisplayName}</span>
        </div>
      </div>
    </div>
  ) : null

  return (
    <SidebarMenuButtonComponent
      ref={ref}
      size="lg"
      hasIcon={!isCollapsed}
      tooltip={
        isCollapsed
          ? {
              children: collapsedTooltipContent,
              className: 'p-1 bg-alternative',
            }
          : undefined
      }
      className={cn(
        'group/project-branch-selector !bg-transparent flex h-auto w-full touch-manipulation text-left data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent',
        isCollapsed ? 'min-h-9 gap-1 !pl-0 !py-0.5 overflow-visible' : 'gap-1.5 pl-0 py-0.5',
        className
      )}
      {...buttonProps}
    >
      {!isCollapsed ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex h-8 aspect-square shrink-0 items-center justify-center rounded border border-strong bg-background-muted text-xs group-hover/project-branch-selector:border-stronger">
                {selectedOrgInitial}
              </div>
            </TooltipTrigger>
            <TooltipContent>{selectedOrg?.name}</TooltipContent>
          </Tooltip>
          <div className="min-w-0 flex-grow text-left">
            <div
              className={cn(
                'w-full truncate leading-tight text-foreground-light transition-colors group-hover/project-branch-selector:text-foreground',
                isCollapsed ? 'max-w-full min-w-0' : 'max-w-[250px]'
              )}
            >
              {displayProjectName}
            </div>
            <div
              className={cn(
                'flex items-center gap-0.5',
                isBranch
                  ? 'text-foreground-lighter group-hover/project-branch-selector:text-foreground-light'
                  : 'text-warning'
              )}
            >
              <GitBranch className="size-3 shrink-0" strokeWidth={1.5} />
              <span className="min-w-0 truncate text-xs leading-tight">{branchDisplayName}</span>
            </div>
          </div>

          <div className="rounded-md p-1 group-hover:bg-surface-200 hover:!bg-selection group-hover:text-foreground">
            <ChevronsUpDown
              strokeWidth={1.5}
              className={cn(
                'ml-auto !h-4 !w-4 text-foreground-lighter group-hover:text-foreground-light',
                isCollapsed && 'hidden'
              )}
            />
          </div>
        </>
      ) : (
        <div className="relative flex h-8 aspect-square shrink-0 items-center justify-center rounded border border-strong bg-background-muted text-xs group-hover:border-stronger">
          <ChevronsUpDown strokeWidth={1.5} className="!h-4 !w-4 text-foreground-lighter" />
        </div>
      )}
    </SidebarMenuButtonComponent>
  )
})
ProjectBranchSelectorTrigger.displayName = 'ProjectBranchSelectorTrigger'
