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
  TabsTrigger_Shadcn_,
} from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'

const embeddedClassName =
  'bg-transparent border-0 shadow-none min-h-0 flex-1 flex flex-col overflow-hidden rounded-none'

export interface ProjectBranchSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set (user is inside a project), default tab is "project". Otherwise "organization". */
  selectedRef: string | undefined
  onClose: () => void
  /** Actual selected entities; used for tab labels and for accessing details inside the sheet. */
  selectedOrganization?: Organization | null
  displayProject?: ProjectDetail | null
  selectedBranch?: Branch | null
  /** Optional overrides for tab labels when you don't pass the full objects. */
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
            {tabs.map(({ value, label, icon: Icon }, index) => {
              const isBranch = value === 'branch'
              const isProductionBranch = isBranch && isMainBranch
              const isLast = index === tabs.length - 1

              return (
                <TabsTrigger_Shadcn_
                  key={value}
                  value={value}
                  className={cn(
                    'group relative text-xs flex flex-col items-center gap-1.5 px-4 py-3 data-[state=active]:bg-surface-200 data-[state=active]:border-foreground-light border-b duration-0',
                    isProductionBranch &&
                      'text-warning data-[state=active]:text-warning hover:text-warning hover:opacity-70'
                  )}
                >
                  <Icon className="shrink-0" size={16} strokeWidth={1.5} />
                  <span className="truncate max-w-full text-xs leading-tight" title={label}>
                    {label}
                  </span>

                  {!isLast && (
                    <svg
                      aria-hidden="true"
                      width="100%"
                      height="100%"
                      viewBox="0 0 6 63"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute duration-0 bottom-0 top-0 -right-2 w-3 h-full z-10"
                    >
                      <path
                        d="M5.49365 31L0.493652 0V62L5.49365 31Z"
                        className="fill-[hsl(var(--background-dash-sidebar))] group-data-[state=active]:fill-[hsl(var(--background-surface-200))]"
                      />
                      <path
                        d="M0.493652 0L5.49365 31L0.493652 62"
                        stroke="hsl(var(--border-default))"
                      />
                    </svg>
                  )}
                </TabsTrigger_Shadcn_>
              )
            })}
          </TabsList_Shadcn_>
        </SheetHeader>
        {tabs.some((t) => t.value === 'organization') && (
          <TabsContent_Shadcn_
            value="organization"
            className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0 data-[state=inactive]:hidden"
          >
            <OrganizationDropdown embedded className={embeddedClassName} onClose={onClose} />
          </TabsContent_Shadcn_>
        )}
        {tabs.some((t) => t.value === 'project') && (
          <TabsContent_Shadcn_
            value="project"
            className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 py-0 data-[state=inactive]:hidden"
          >
            <ProjectDropdown embedded className={embeddedClassName} onClose={onClose} />
          </TabsContent_Shadcn_>
        )}
        {tabs.some((t) => t.value === 'branch') && (
          <TabsContent_Shadcn_
            value="branch"
            className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0 data-[state=inactive]:hidden"
          >
            <BranchDropdown embedded className={embeddedClassName} onClose={onClose} />
          </TabsContent_Shadcn_>
        )}
      </Tabs_Shadcn_>
    </MobileSheetNav>
  )
}
