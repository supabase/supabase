import { useBreakpoint, useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  cn,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getProjectBranchSelectorState } from './ProjectBranchSelector.utils'
import { ProjectBranchSelectorOverlay } from './ProjectBranchSelectorOverlay'
import { ProjectBranchSelectorPopover } from './ProjectBranchSelectorPopover'
import { ProjectBranchSelectorSheet } from './ProjectBranchSelectorSheet'
import { ProjectBranchSelectorTrigger } from './ProjectBranchSelectorTrigger'
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

export function ProjectBranchSelector({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const router = useRouter()
  const { ref } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const isNavigationV2 = useIsNavigationV2Enabled()

  const isBranch = project?.parentRef !== project?.ref
  const isProductionBranch = !isBranch
  const { data: parentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: isBranch }
  )
  const displayProject = parentProject ?? project

  const [sheetOpen, setSheetOpen] = useState(false)
  const [mobileCollapsedOverlayOpen, setMobileCollapsedOverlayOpen] = useState(false)
  const [collapsedDesktopOpen, setCollapsedDesktopOpen] = useState(false)

  const isMobile = useBreakpoint('md')
  const isSplitDesktop = !isMobile && !isCollapsed

  const isBranchingEnabled = project?.is_branch_enabled === true
  const { data: branches } = useBranchesQuery(
    { projectRef: project?.parent_project_ref || ref },
    {
      enabled:
        Boolean(project) && (sheetOpen || collapsedDesktopOpen || mobileCollapsedOverlayOpen),
    }
  )

  const selectedBranch = branches?.find((b) => b.project_ref === ref)
  const { isMainBranch, branchDisplayName, organizationHref } = getProjectBranchSelectorState({
    selectedBranch,
    isBranchingEnabled,
    selectedOrganization: selectedOrganization ?? undefined,
  })

  const goToOrganization = () => {
    setCollapsedDesktopOpen(false)
    router.push(organizationHref)
  }

  const navigateToProjectHome = () => {
    const targetRef = ref ?? project?.ref
    if (!targetRef) return
    router.push(`/project/${targetRef}`)
  }

  if (isLoadingProject || !displayProject)
    return (
      <ShimmeringLoader
        className={cn(
          'ml-1 w-[120px] md:py-3',
          isNavigationV2 && 'ml-0 h-10 w-full rounded-md',
          isCollapsed && 'min-w-0 max-w-full'
        )}
      />
    )

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
    selectedOrg: selectedOrganization,
    isBranch,
    isProductionBranch,
    branchDisplayName,
    onGoToOrganization: goToOrganization,
    isCollapsed,
  }

  if (isMobile) {
    if (isCollapsed) {
      return (
        <ProjectBranchSelectorOverlay
          open={mobileCollapsedOverlayOpen}
          onOpenChange={setMobileCollapsedOverlayOpen}
          showOrganizationColumn
          anchor={
            <ProjectBranchSelectorTrigger
              {...triggerProps}
              interactionMode="unified"
              onClick={() => setMobileCollapsedOverlayOpen(true)}
            />
          }
        />
      )
    }

    return (
      <>
        <ProjectBranchSelectorTrigger
          {...triggerProps}
          interactionMode="unified"
          onClick={() => setSheetOpen(true)}
        />
        <ProjectBranchSelectorSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          selectedRef={ref}
          onClose={() => setSheetOpen(false)}
          selectedOrganization={selectedOrganization ?? null}
          displayProject={displayProject ?? null}
          selectedBranch={selectedBranch ?? null}
          isMainBranch={isMainBranch}
        />
      </>
    )
  }

  if (isSplitDesktop) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <ProjectBranchSelectorTrigger
            {...triggerProps}
            interactionMode="split-desktop"
            onProjectHome={navigateToProjectHome}
          />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover_Shadcn_
          open={collapsedDesktopOpen}
          onOpenChange={setCollapsedDesktopOpen}
          modal={false}
        >
          <PopoverTrigger_Shadcn_ asChild>
            <ProjectBranchSelectorTrigger {...triggerProps} interactionMode="unified" />
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="w-[780px] p-0" side="bottom" align="start">
            <ProjectBranchSelectorPopover
              showOrganizationColumn
              onClose={() => setCollapsedDesktopOpen(false)}
            />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
