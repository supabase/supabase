import { useBreakpoint, useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ProjectBranchSelectorPopover } from './ProjectBranchSelectorPopover'
import { ProjectBranchSelectorSheet } from './ProjectBranchSelectorSheet'
import { ProjectBranchSelectorTrigger } from './ProjectBranchSelectorTrigger'

export function ProjectBranchSelector() {
  const router = useRouter()
  const { ref } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const isBranch = project?.parentRef !== project?.ref
  const isProductionBranch = !isBranch
  const { data: parentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: isBranch }
  )
  const displayProject = parentProject ?? project

  const [open, setOpen] = useState(false)

  const isBranchingEnabled = project?.is_branch_enabled === true
  const { data: branches } = useBranchesQuery(
    { projectRef: project?.parent_project_ref || ref },
    { enabled: open && Boolean(project) }
  )

  const selectedBranch = branches?.find((b) => b.project_ref === ref)
  /** When branching is disabled we're always on main; when enabled, main is the branch with is_default. */
  const isMainBranch = !isBranchingEnabled || selectedBranch?.is_default === true
  const branchDisplayName = isBranchingEnabled ? selectedBranch?.name ?? 'main' : 'main'
  const selectedOrgInitial = selectedOrganization?.name?.trim().charAt(0).toUpperCase() || 'O'
  const organizationHref = selectedOrganization?.slug
    ? `/org/${selectedOrganization.slug}`
    : '/organizations'
  const goToOrganization = () => {
    setOpen(false)
    router.push(organizationHref)
  }

  const isMobile = useBreakpoint('md')

  if (isLoadingProject || !displayProject) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <ShimmeringLoader className="w-full py-3" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!IS_PLATFORM) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="grid flex-1 text-left text-sm leading-tight text-foreground">
            <span className="truncate">{displayProject.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const triggerProps = {
    displayProjectName: displayProject.name,
    selectedOrgInitial,
    isBranch,
    isProductionBranch,
    branchDisplayName,
    onGoToOrganization: goToOrganization,
  }

  if (isMobile) {
    return (
      <>
        <ProjectBranchSelectorTrigger {...triggerProps} onClick={() => setOpen(true)} />
        <ProjectBranchSelectorSheet
          open={open}
          onOpenChange={setOpen}
          selectedRef={ref}
          onClose={() => setOpen(false)}
          selectedOrganization={selectedOrganization ?? null}
          displayProject={displayProject ?? null}
          selectedBranch={selectedBranch ?? null}
          isMainBranch={isMainBranch}
        />
      </>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <ProjectBranchSelectorTrigger {...triggerProps} />
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-[780px]" side="bottom" align="start">
            <ProjectBranchSelectorPopover onClose={() => setOpen(false)} />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
