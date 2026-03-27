'use client'

import { useBranchesQuery } from 'data/branches/branches-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo, useState } from 'react'
import {
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { ProjectBranchSelectorPopover } from '@/components/v2/Navigation/ProjectBranchSelectorPopover'
import { ProjectBranchSelectorTrigger } from '@/components/v2/Navigation/ProjectBranchSelectorTrigger'

export function V2ProjectBranchSelector() {
  const { orgSlug, projectRef } = useV2Params()
  const [open, setOpen] = useState(false)

  const { data: organizations } = useOrganizationsQuery()
  const selectedOrg = useMemo(
    () => organizations?.find((o) => o.slug === orgSlug),
    [organizations, orgSlug]
  )

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const isBranch =
    Boolean(project?.parent_project_ref) && project?.parent_project_ref !== project?.ref
  const { data: parentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: Boolean(isBranch && project?.parent_project_ref) }
  )
  const displayProject = parentProject ?? project

  const parentRef = displayProject?.ref ?? project?.parent_project_ref ?? projectRef
  const { data: branches } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: IS_PLATFORM && Boolean(parentRef) }
  )

  const selectedBranch = branches?.find((b) => b.project_ref === projectRef)
  const branchDisplayName = selectedBranch?.name ?? 'main'
  const isProductionBranch = selectedBranch?.is_default ?? true

  const isTriggerLoading = Boolean(projectRef) && (isProjectPending || !displayProject)

  if (!IS_PLATFORM) {
    if (isTriggerLoading) return <ShimmeringLoader className="w-[120px]" />

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="grid flex-1 text-left text-sm leading-tight text-foreground">
            <span className="truncate">{displayProject?.name ?? projectRef ?? 'Project'}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            {isTriggerLoading ? (
              <ShimmeringLoader className="w-[120px]" />
            ) : (
              <ProjectBranchSelectorTrigger
                displayProjectName={displayProject?.name ?? projectRef ?? 'Project'}
                selectedOrg={selectedOrg}
                isBranch={!isProductionBranch}
                isProductionBranch={isProductionBranch}
                branchDisplayName={branchDisplayName}
                onGoToOrganization={() => setOpen(false)}
              />
            )}
          </PopoverTrigger_Shadcn_>

          <PopoverContent_Shadcn_ className="p-0 w-[780px]" side="bottom" align="start">
            <ProjectBranchSelectorPopover onClose={() => setOpen(false)} />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
