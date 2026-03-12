import { BranchDropdown } from 'components/layouts/AppLayout/BranchDropdown'
import { OrganizationDropdown } from 'components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from 'components/layouts/AppLayout/ProjectDropdown'
import type { Branch } from 'data/branches/branches-query'
import type { ProjectDetail } from 'data/projects/project-detail-query'
import { Box, Boxes, GitBranch } from 'lucide-react'
import type { Organization } from 'types'
import {
  cn,
  SheetHeader,
  SheetTitle,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
} from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'

import { ProjectBranchSelectorSheetTabTrigger } from './ProjectBranchSelectorSheetTabTrigger'

const EMBEDDED_CLASSNAME =
  'bg-transparent border-0 shadow-none min-h-0 flex-1 flex flex-col overflow-hidden rounded-none'

export interface ProjectBranchSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRef: string | undefined
  onClose: () => void
  selectedOrganization?: Organization | null
  displayProject?: ProjectDetail | null
  selectedBranch?: Branch | null
  selectedOrganizationName?: string | null
  selectedProjectName?: string | null
  selectedBranchName?: string | null
  isMainBranch?: boolean
}

export function ProjectBranchSelectorSheet({
  open,
  onOpenChange,
  selectedRef,
  onClose,
  selectedOrganization,
  displayProject,
  selectedBranch,
  selectedOrganizationName,
  selectedProjectName,
  selectedBranchName,
  isMainBranch,
}: ProjectBranchSelectorSheetProps) {
  const orgLabel = selectedOrganizationName ?? selectedOrganization?.name
  const projectLabel = selectedProjectName ?? displayProject?.name
  const branchLabel = selectedBranchName ?? selectedBranch?.name ?? 'main'

  const tabs = [
    orgLabel && {
      value: 'organization' as const,
      label: orgLabel,
      icon: Boxes,
    },
    projectLabel && {
      value: 'project' as const,
      label: projectLabel,
      icon: Box,
    },
    branchLabel && {
      value: 'branch' as const,
      label: branchLabel,
      icon: GitBranch,
    },
  ].filter(Boolean) as Array<{
    value: 'organization' | 'project' | 'branch'
    label: string
    icon: typeof Boxes
  }>

  const defaultTab =
    (selectedRef && tabs.some((t) => t.value === 'project') ? 'project' : tabs[0]?.value) ??
    'organization'

  if (tabs.length === 0) {
    return null
  }

  return (
    <MobileSheetNav
      open={open}
      onOpenChange={onOpenChange}
      className="flex flex-col overflow-hidden h-[85dvh] md:max-h-[500px]"
    >
      <Tabs_Shadcn_
        defaultValue={defaultTab}
        className="flex flex-col flex-1 min-h-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-0 border-default p-0 shrink-0">
          <SheetTitle className="sr-only">Switch organization, project or branch</SheetTitle>
          <TabsList_Shadcn_
            className={cn(
              'w-full grid gap-0 shrink-0',
              tabs.length === 1 && 'grid-cols-1',
              tabs.length === 2 && 'grid-cols-2',
              tabs.length === 3 && 'grid-cols-3'
            )}
          >
            {tabs.map(({ value, label, icon }, index) => (
              <ProjectBranchSelectorSheetTabTrigger
                key={value}
                value={value}
                label={label}
                icon={icon}
                isMainBranch={value === 'branch' ? isMainBranch : undefined}
                isLast={index === tabs.length - 1}
              />
            ))}
          </TabsList_Shadcn_>
        </SheetHeader>
        {tabs.some((t) => t.value === 'organization') && (
          <TabsContent_Shadcn_
            value="organization"
            className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0 data-[state=inactive]:hidden"
          >
            <OrganizationDropdown embedded className={EMBEDDED_CLASSNAME} onClose={onClose} />
          </TabsContent_Shadcn_>
        )}
        {tabs.some((t) => t.value === 'project') && (
          <TabsContent_Shadcn_
            value="project"
            className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 py-0 data-[state=inactive]:hidden"
          >
            <ProjectDropdown embedded className={EMBEDDED_CLASSNAME} onClose={onClose} />
          </TabsContent_Shadcn_>
        )}
        {tabs.some((t) => t.value === 'branch') && (
          <TabsContent_Shadcn_
            value="branch"
            className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0 data-[state=inactive]:hidden"
          >
            <BranchDropdown embedded className={EMBEDDED_CLASSNAME} onClose={onClose} />
          </TabsContent_Shadcn_>
        )}
      </Tabs_Shadcn_>
    </MobileSheetNav>
  )
}
