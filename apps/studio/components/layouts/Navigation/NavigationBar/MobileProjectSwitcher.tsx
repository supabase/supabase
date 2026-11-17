import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getMobileProjectSwitcherState } from './MobileProjectSwitcher.utils'
import { MobileProjectSwitcherSheet } from './MobileProjectSwitcherSheet'
import { MobileProjectSwitcherTrigger } from './MobileProjectSwitcherTrigger'
import { branchesQueryOptions } from '@/data/branches/branches-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { useGrant } from '@/lib/grants'

export function MobileProjectSwitcher() {
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
  const branchesProjectRef = project?.parent_project_ref || ref
  const branchesGrant = useGrant('GET /v1/projects/{ref}/branches', {
    projectRef: branchesProjectRef,
  })
  const { data: branches } = useQuery(
    branchesQueryOptions(
      { projectRef: branchesProjectRef, grant: branchesGrant.grant },
      { enabled: open && Boolean(project) }
    )
  )

  const selectedBranch = branches?.find((b) => b.project_ref === ref)
  const { isMainBranch, branchDisplayName, selectedOrgInitial, organizationHref } =
    getMobileProjectSwitcherState({
      selectedBranch,
      isBranchingEnabled,
      selectedOrganization: selectedOrganization ?? undefined,
    })

  const goToOrganization = () => {
    setOpen(false)
    router.push(organizationHref)
  }

  if (isLoadingProject || !displayProject)
    return <ShimmeringLoader className="w-[120px] ml-1 md:py-3" />

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

  return (
    <>
      <MobileProjectSwitcherTrigger {...triggerProps} onClick={() => setOpen(true)} />
      <MobileProjectSwitcherSheet
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
