import { useParams } from 'common'
import { Check, ListTree, MessageCircle, Plus, Shield } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { OrganizationDropdown } from '@/components/layouts/AppLayout/OrganizationDropdown'
import { sanitizeRoute } from '@/components/layouts/AppLayout/ProjectDropdown.utils'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { useBranchesQuery } from '@/data/branches/branches-query'
import type { Branch } from '@/data/branches/branches-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { useAppStateSnapshot } from '@/state/app-state'

const BRANCHING_GITHUB_DISCUSSION_LINK = 'https://github.com/orgs/supabase/discussions/18937'

export interface ProjectBranchSelectorPopoverProps {
  onClose: () => void
  /** When false, org is chosen elsewhere; only project + branch columns render. */
  showOrganizationColumn?: boolean
}

export function ProjectBranchSelectorPopover({
  onClose,
  showOrganizationColumn = true,
}: ProjectBranchSelectorPopoverProps) {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const isBranch = project?.parentRef !== project?.ref
  const { data: parentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: isBranch }
  )
  const displayProject = parentProject ?? project
  const parentRef = project?.parent_project_ref || ref

  const [activeOrganizationSlug, setActiveOrganizationSlug] = useState<string | undefined>(
    selectedOrganization?.slug
  )

  useEffect(() => {
    setActiveOrganizationSlug(selectedOrganization?.slug)
  }, [selectedOrganization?.slug])

  const { data: branches, isSuccess: isBranchesSuccess } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: Boolean(project) }
  )

  const isBranchingEnabled = project?.is_branch_enabled === true
  const selectedBranch = branches?.find((b) => b.project_ref === ref)
  const mainBranch = branches?.find((b) => b.is_default)
  const restOfBranches = branches
    ?.filter((b) => !b.is_default)
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const defaultMainBranch = {
    id: 'main',
    name: 'main',
    project_ref: parentRef ?? ref ?? '',
    is_default: true,
  } as unknown as Branch

  const sortedBranches =
    branches && branches.length > 0
      ? mainBranch
        ? [mainBranch].concat(restOfBranches ?? [])
        : (restOfBranches ?? [])
      : [defaultMainBranch]
  const branchList = isBranchingEnabled ? sortedBranches : [defaultMainBranch]

  if (!IS_PLATFORM) return null
  if (!displayProject) return null

  const organizationSlugForProjects = showOrganizationColumn
    ? (activeOrganizationSlug ?? selectedOrganization?.slug)
    : selectedOrganization?.slug

  return (
    <div className="flex divide-x h-[320px]">
      {showOrganizationColumn ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <OrganizationDropdown
            renderCommandContentOnly
            className="bg-transparent border-0 shadow-none min-h-0 flex-1 flex flex-col overflow-hidden rounded-none"
            onClose={onClose}
            onSelectOrganization={(org) => setActiveOrganizationSlug(org.slug)}
          />
        </div>
      ) : null}
      <ProjectColumn
        selectedRef={ref}
        onClose={onClose}
        organizationSlug={organizationSlugForProjects}
        projectCreationEnabled={projectCreationEnabled}
      />
      <BranchColumn
        branches={branchList}
        selectedBranch={selectedBranch}
        isBranchingEnabled={isBranchingEnabled}
        isBranchesLoaded={isBranchesSuccess}
        onSelect={(branch) => {
          const sanitizedRoute = sanitizeRoute(router.route, router.query)
          const href =
            sanitizedRoute?.replace('[ref]', branch.project_ref) ?? `/project/${branch.project_ref}`
          onClose()
          router.push(href)
        }}
        onCreateBranch={() => {
          onClose()
          snap.setShowCreateBranchModal(true)
        }}
        onManageBranches={() => {
          onClose()
          router.push(`/project/${ref}/branches`)
        }}
        onClose={onClose}
      />
    </div>
  )
}

function ProjectColumn({
  selectedRef,
  onClose,
  organizationSlug,
  projectCreationEnabled,
}: {
  selectedRef?: string
  onClose: () => void
  organizationSlug?: string
  projectCreationEnabled: boolean
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <OrganizationProjectSelector
        renderOnlyContent
        fetchOnMount
        slug={organizationSlug}
        selectedRef={selectedRef ?? null}
        className="bg-transparent border-0 shadow-none min-h-0 flex-1 flex flex-col overflow-hidden rounded-none"
        onSelect={(project) => {
          const sanitizedRoute = sanitizeRoute(router.route, router.query)
          const href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
          onClose()
          router.push(href)
        }}
        renderActions={() =>
          projectCreationEnabled && organizationSlug ? (
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                className="cursor-pointer w-full"
                onSelect={() => {
                  onClose()
                  router.push(`/new/${organizationSlug}`)
                }}
              >
                <span className="flex w-full items-center gap-2">
                  <Plus size={14} strokeWidth={1.5} />
                  <p>New project</p>
                </span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          ) : null
        }
      />
    </div>
  )
}

function BranchColumn({
  branches,
  selectedBranch,
  isBranchingEnabled,
  isBranchesLoaded,
  onSelect,
  onCreateBranch,
  onManageBranches,
  onClose,
}: {
  branches: Branch[]
  selectedBranch?: Branch
  isBranchingEnabled: boolean
  isBranchesLoaded: boolean
  onSelect: (branch: Branch) => void
  onCreateBranch: () => void
  onManageBranches: () => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()

  const filteredBranches = branches.filter((b) => b.name.toLowerCase().includes(lowerSearch))

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <Command_Shadcn_ shouldFilter={false} className="min-h-0 flex-1 rounded-none border-0">
        <CommandInput_Shadcn_
          value={search}
          onValueChange={setSearch}
          placeholder="Find branch..."
          showResetIcon
          handleReset={() => setSearch('')}
        />
        <CommandList_Shadcn_ className="max-h-none flex-1 overflow-y-auto">
          {!isBranchesLoaded ? (
            <div className="space-y-1 p-2">
              <ShimmeringLoader className="py-2" />
              <ShimmeringLoader className="py-2 w-4/5" />
            </div>
          ) : (
            <>
              <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {filteredBranches.map((branch) => {
                  const isSelected =
                    branch.id === selectedBranch?.id || (!selectedBranch && branch.is_default)
                  return (
                    <CommandItem_Shadcn_
                      key={branch.id}
                      value={branch.name.replaceAll('"', '')}
                      className="cursor-pointer w-full"
                      onSelect={() => onSelect(branch)}
                    >
                      <span className="truncate flex flex-1 items-center gap-1.5">
                        {branch.is_default && (
                          <Shield size={12} className="text-amber-900 shrink-0" />
                        )}
                        {branch.name}
                      </span>
                      {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
            </>
          )}
        </CommandList_Shadcn_>
        <CommandSeparator_Shadcn_ />
        <CommandGroup_Shadcn_ className="space-y-0.5">
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              onClose()
              window.open(BRANCHING_GITHUB_DISCUSSION_LINK, '_blank', 'noopener,noreferrer')
            }}
          >
            <span className="flex w-full items-center gap-2">
              <MessageCircle size={14} strokeWidth={1.5} />
              <p>Branching feedback</p>
            </span>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
        <CommandSeparator_Shadcn_ />
        <CommandGroup_Shadcn_ className=" space-y-0.5">
          {isBranchingEnabled && (
            <CommandItem_Shadcn_
              className="cursor-pointer w-full"
              onSelect={() => onManageBranches()}
            >
              <span className="flex w-full items-center gap-2">
                <ListTree size={14} strokeWidth={1.5} />
                <p>Manage branches</p>
              </span>
            </CommandItem_Shadcn_>
          )}
          <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onCreateBranch()}>
            <span className="flex w-full items-center gap-2">
              <Plus size={14} strokeWidth={1.5} />
              <p>Create branch</p>
            </span>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </Command_Shadcn_>
    </div>
  )
}
