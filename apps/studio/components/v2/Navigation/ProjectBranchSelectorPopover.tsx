'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, ListTree, MessageCircle, Plus, Shield } from 'lucide-react'
import Link from 'next/link'

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

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { useBranchesQuery } from 'data/branches/branches-query'
import type { Branch } from 'data/branches/branches-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useAppStateSnapshot } from 'state/app-state'
import { IS_PLATFORM } from 'lib/constants'

const BRANCHING_GITHUB_DISCUSSION_LINK = 'https://github.com/orgs/supabase/discussions/18937'

export interface ProjectBranchSelectorPopoverProps {
  onClose: () => void
}

export function ProjectBranchSelectorPopover({ onClose }: ProjectBranchSelectorPopoverProps) {
  const router = useRouter()
  const snap = useAppStateSnapshot()
  const { orgSlug, projectRef } = useV2Params()
  const { data: organizations } = useOrganizationsQuery()
  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const [activeOrganizationSlug, setActiveOrganizationSlug] = useState<string | undefined>(orgSlug)

  useEffect(() => {
    setActiveOrganizationSlug(orgSlug)
  }, [orgSlug])

  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const isBranch =
    Boolean(project?.parent_project_ref) && project?.parent_project_ref !== project?.ref
  const { data: parentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: Boolean(isBranch && project?.parent_project_ref) }
  )
  const parentRef = parentProject?.ref ?? project?.parent_project_ref ?? projectRef

  const { data: branches, isSuccess: isBranchesSuccess } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: IS_PLATFORM && Boolean(parentRef) }
  )

  const isBranchingEnabled = project?.is_branch_enabled === true
  const selectedBranch = branches?.find((b) => b.project_ref === projectRef)
  const mainBranch = branches?.find((b) => b.is_default)
  const restOfBranches = branches
    ?.filter((b) => !b.is_default)
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const defaultMainBranch = {
    id: 'main',
    name: 'main',
    project_ref: parentRef ?? projectRef ?? '',
    is_default: true,
  } as unknown as Branch

  const sortedBranches =
    branches && branches.length > 0
      ? mainBranch
        ? [mainBranch].concat(restOfBranches ?? [])
        : (restOfBranches ?? [])
      : [defaultMainBranch]
  const branchList = isBranchingEnabled ? sortedBranches : [defaultMainBranch]

  return (
    <div className="flex divide-x h-[320px]">
      <OrganizationColumn
        organizations={organizations ?? []}
        selectedSlug={activeOrganizationSlug}
        organizationCreationEnabled={organizationCreationEnabled}
        onSelect={(slug) => setActiveOrganizationSlug(slug)}
        onClose={onClose}
      />
      <ProjectColumn
        organizationSlug={activeOrganizationSlug}
        selectedRef={projectRef}
        projectCreationEnabled={projectCreationEnabled}
        onSelect={(ref) => {
          onClose()
          router.push(`/v2/project/${ref}/data/tables`)
        }}
        onClose={onClose}
      />
      <BranchColumn
        branches={branchList}
        selectedBranch={selectedBranch}
        isBranchingEnabled={isBranchingEnabled}
        isBranchesLoaded={isBranchesSuccess}
        onSelect={(branch) => {
          onClose()
          router.push(`/v2/project/${branch.project_ref}/data/tables`)
        }}
        onCreateBranch={() => {
          onClose()
          snap.setShowCreateBranchModal(true)
        }}
        onManageBranches={() => {
          onClose()
          router.push(`/v2/project/${projectRef}/settings/branches`)
        }}
        onClose={onClose}
      />
    </div>
  )
}

// --- Columns ---

function OrganizationColumn({
  organizations,
  selectedSlug,
  organizationCreationEnabled,
  onSelect,
  onClose,
}: {
  organizations: Array<{ id: number; slug: string; name: string }>
  selectedSlug?: string
  organizationCreationEnabled: boolean
  onSelect: (slug: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()
  const filtered = organizations.filter(
    (o) => o.name.toLowerCase().includes(lowerSearch) || o.slug.toLowerCase().includes(lowerSearch)
  )

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <Command_Shadcn_ shouldFilter={false} className="min-h-0 flex-1 rounded-none border-0">
        <CommandInput_Shadcn_
          value={search}
          onValueChange={setSearch}
          placeholder="Find organization..."
          showResetIcon
          handleReset={() => setSearch('')}
        />
        <CommandList_Shadcn_ className="max-h-none flex-1 overflow-y-auto">
          <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_>
            {filtered.map((org) => (
              <CommandItem_Shadcn_
                key={org.id}
                value={`${org.name.replaceAll('"', '')} - ${org.slug}`}
                className="cursor-pointer w-full"
                onSelect={() => onSelect(org.slug)}
              >
                <span className="truncate flex flex-1 items-center gap-1.5">{org.name}</span>
                {org.slug === selectedSlug && <Check size={14} className="shrink-0 ml-2" />}
              </CommandItem_Shadcn_>
            ))}
          </CommandGroup_Shadcn_>
        </CommandList_Shadcn_>
        {organizationCreationEnabled && (
          <>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
                <Link href="/new" className="flex items-center gap-2 w-full" onClick={onClose}>
                  <Plus size={14} strokeWidth={1.5} />
                  <p>New organization</p>
                </Link>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </>
        )}
      </Command_Shadcn_>
    </div>
  )
}

function ProjectColumn({
  organizationSlug,
  selectedRef,
  projectCreationEnabled,
  onSelect,
  onClose,
}: {
  organizationSlug?: string
  selectedRef?: string
  projectCreationEnabled: boolean
  onSelect: (ref: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()

  const { data: projectsData, isPending: isProjectsPending } = useOrgProjectsInfiniteQuery(
    { slug: organizationSlug, limit: 50 },
    { enabled: Boolean(organizationSlug) }
  )
  const projects = projectsData?.pages?.flatMap((p) => p.projects) ?? []
  const filtered = projects.filter((p) => p.name.toLowerCase().includes(lowerSearch))

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <Command_Shadcn_ shouldFilter={false} className="min-h-0 flex-1 rounded-none border-0">
        <CommandInput_Shadcn_
          value={search}
          onValueChange={setSearch}
          placeholder="Find project..."
          showResetIcon
          handleReset={() => setSearch('')}
        />
        <CommandList_Shadcn_ className="max-h-none flex-1 overflow-y-auto">
          {isProjectsPending ? (
            <div className="space-y-1 p-2">
              <ShimmeringLoader className="py-2" />
              <ShimmeringLoader className="py-2 w-4/5" />
            </div>
          ) : (
            <>
              <CommandEmpty_Shadcn_>No projects found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {filtered.map((proj) => (
                  <CommandItem_Shadcn_
                    key={proj.ref}
                    value={`${proj.name.replaceAll('"', '')} ${proj.ref}`}
                    className="cursor-pointer w-full"
                    onSelect={() => onSelect(proj.ref)}
                  >
                    <span className="truncate flex flex-1 items-center gap-1.5">{proj.name}</span>
                    {proj.ref === selectedRef && <Check size={14} className="shrink-0 ml-2" />}
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            </>
          )}
        </CommandList_Shadcn_>
        {projectCreationEnabled && organizationSlug && (
          <>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
                <Link
                  href={`/new/${organizationSlug}`}
                  className="flex items-center gap-2 w-full"
                  onClick={onClose}
                >
                  <Plus size={14} strokeWidth={1.5} />
                  <p>New project</p>
                </Link>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </>
        )}
      </Command_Shadcn_>
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
        <CommandGroup_Shadcn_ className="space-y-0.5">
          <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
            <Link
              href={BRANCHING_GITHUB_DISCUSSION_LINK}
              target="_blank"
              className="flex items-center gap-2 w-full"
            >
              <MessageCircle size={14} strokeWidth={1.5} />
              <p>Branching feedback</p>
            </Link>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
        <CommandSeparator_Shadcn_ />
        <CommandGroup_Shadcn_ className="space-y-0.5">
          {isBranchingEnabled && (
            <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
              <button
                onClick={onManageBranches}
                type="button"
                className="flex items-center gap-2 w-full"
              >
                <ListTree size={14} strokeWidth={1.5} />
                <p>Manage branches</p>
              </button>
            </CommandItem_Shadcn_>
          )}
          <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
            <button
              onClick={onCreateBranch}
              type="button"
              className="flex items-center gap-2 w-full"
            >
              <Plus size={14} strokeWidth={1.5} />
              <p>Create branch</p>
            </button>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </Command_Shadcn_>
    </div>
  )
}
