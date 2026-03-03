import { ParsedUrlQuery } from 'querystring'
import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { OrgProject, useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { Check, ChevronLeft, ChevronsUpDown, GitBranch, ListTree, Plus, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Badge,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

function sanitizeRoute(route: string, routerQueries: ParsedUrlQuery) {
  const queryArray = Object.entries(routerQueries)
  if (queryArray.length > 1) {
    const isStorageBucketRoute = 'bucketId' in routerQueries
    const isSecurityAdvisorRoute = 'preset' in routerQueries
    return route
      .split('/')
      .slice(0, isStorageBucketRoute || isSecurityAdvisorRoute ? 5 : 4)
      .join('/')
  }
  return route
}

export function ProjectBranchSelector() {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: organizations, isPending: isLoadingOrganizations } = useOrganizationsQuery()
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const isBranch = project?.parentRef !== project?.ref
  const isProductionBranch = !isBranch
  const { data: parentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: isBranch }
  )
  const displayProject = parentProject ?? project
  const parentRef = project?.parent_project_ref || ref

  const [open, setOpen] = useState(false)
  const [activeOrganizationSlug, setActiveOrganizationSlug] = useState<string | undefined>(
    selectedOrganization?.slug
  )

  // Branch data
  const { data: branches, isSuccess: isBranchesSuccess } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: open && Boolean(project) }
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
        : restOfBranches ?? []
      : [defaultMainBranch]
  const branchList = isBranchingEnabled ? sortedBranches : [defaultMainBranch]

  const branchDisplayName = isBranchingEnabled ? selectedBranch?.name ?? 'main' : 'main'
  const currentOrganizationSlug = selectedOrganization?.slug
  const selectedOrgInitial = selectedOrganization?.name?.trim().charAt(0).toUpperCase() || 'O'
  const organizationHref = currentOrganizationSlug
    ? `/org/${currentOrganizationSlug}`
    : '/organizations'
  const goToOrganization = () => {
    setOpen(false)
    router.push(organizationHref)
  }

  useEffect(() => {
    if (open) {
      setActiveOrganizationSlug(currentOrganizationSlug)
    }
  }, [open, currentOrganizationSlug])

  if (isLoadingProject || !displayProject) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-2 py-2">
            <ShimmeringLoader className="w-full py-3" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!IS_PLATFORM) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="gap-3">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayProject.name}</span>
            </div>
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
            <SidebarMenuButton
              size="lg"
              className="group py-1 gap-2 w-full flex h-auto text-left data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className={cn(
                  'relative flex h-8 aspect-square shrink-0 items-center bg-background-muted hover:bg-selection hover:border-stronger justify-center rounded border border-strong text-xs font-medium'
                  // isProductionBranch
                  //   ? 'bg-warning-600 border-warning-600 text-white'
                  //   : 'bg-surface-100 text-foreground-lighter'
                )}
              >
                <span className="group-hover:hidden">{selectedOrgInitial}</span>
                <button
                  className={cn(
                    'hidden group-hover:flex h-full w-full items-center justify-center  cursor-pointer',
                    isProductionBranch
                      ? 'text-foreground hover:text-foreground/90'
                      : 'text-foreground hover:text-foreground-light'
                  )}
                  type="button"
                  tabIndex={0}
                  aria-label="Go to organization"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    goToOrganization()
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    event.stopPropagation()
                    goToOrganization()
                  }}
                >
                  <ChevronLeft size={14} strokeWidth={1.5} />
                </button>
              </div>
              <div className="text-left flex-grow min-w-0">
                <div className="w-full truncate text-foreground font-medium leading-tight -mb-0.5">
                  {displayProject.name}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 -mb-0.5',
                    isBranch ? 'text-green-900' : 'text-amber-900'
                  )}
                >
                  <GitBranch size={12} className="shrink-0" />
                  <span className="truncate min-w-0 leading-tight">{branchDisplayName}</span>
                </div>
              </div>

              <ChevronsUpDown
                strokeWidth={1.5}
                className="ml-auto text-foreground-lighter !w-4 !h-4 hidden group-hover:flex"
              />
            </SidebarMenuButton>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-[780px]" side="bottom" align="start">
            <div className="flex divide-x h-[320px]">
              <OrganizationColumn
                organizations={organizations ?? []}
                isLoading={isLoadingOrganizations}
                selectedSlug={activeOrganizationSlug ?? currentOrganizationSlug}
                onSelect={(slug) => setActiveOrganizationSlug(slug)}
              />
              <ProjectColumn
                selectedRef={ref}
                onSelect={(project) => {
                  const sanitizedRoute = sanitizeRoute(router.route, router.query)
                  const href =
                    sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
                  setOpen(false)
                  router.push(href)
                }}
                onClose={() => setOpen(false)}
                organizationSlug={activeOrganizationSlug ?? currentOrganizationSlug}
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
                    sanitizedRoute?.replace('[ref]', branch.project_ref) ??
                    `/project/${branch.project_ref}`
                  setOpen(false)
                  router.push(href)
                }}
                onCreateBranch={() => {
                  setOpen(false)
                  snap.setShowCreateBranchModal(true)
                }}
                onManageBranches={() => {
                  setOpen(false)
                  router.push(`/project/${ref}/branches`)
                }}
              />
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function OrganizationColumn({
  organizations,
  isLoading,
  selectedSlug,
  onSelect,
}: {
  organizations: Array<{ slug: string; name: string }>
  isLoading: boolean
  selectedSlug?: string
  onSelect: (slug: string) => void
}) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()

  const filteredOrganizations = organizations.filter((organization) => {
    if (normalizedSearch.length === 0) return true

    return (
      organization.name.toLowerCase().includes(normalizedSearch) ||
      organization.slug.toLowerCase().includes(normalizedSearch)
    )
  })

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
          {isLoading ? (
            <div className="space-y-1 p-2">
              <ShimmeringLoader className="py-2" />
              <ShimmeringLoader className="py-2 w-4/5" />
            </div>
          ) : (
            <>
              <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {filteredOrganizations.map((organization) => {
                  const isSelected = organization.slug === selectedSlug

                  return (
                    <CommandItem_Shadcn_
                      key={organization.slug}
                      value={`${organization.name.replaceAll('"', '')} - ${organization.slug}`}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer',
                        isSelected && 'bg-surface-200'
                      )}
                      onSelect={() => onSelect(organization.slug)}
                    >
                      <span className="truncate">{organization.name}</span>
                      {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
            </>
          )}
        </CommandList_Shadcn_>
      </Command_Shadcn_>
    </div>
  )
}

// ─── Project column (left) ────────────────────────────────────────────────────

function ProjectColumn({
  selectedRef,
  onSelect,
  onClose,
  organizationSlug,
  projectCreationEnabled,
}: {
  selectedRef?: string
  onSelect: (project: OrgProject) => void
  onClose: () => void
  organizationSlug?: string
  projectCreationEnabled: boolean
}) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, isError } =
    useOrgProjectsInfiniteQuery(
      { slug: organizationSlug, search: search.length === 0 ? search : debouncedSearch },
      { placeholderData: keepPreviousData }
    )

  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects), [data?.pages]) || []

  useEffect(() => {
    if (!isLoading && !isFetching && entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetching, isFetchingNextPage, isLoading, fetchNextPage])

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
        <CommandList_Shadcn_ ref={scrollRootRef} className="max-h-none flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              <ShimmeringLoader className="py-2" />
              <ShimmeringLoader className="py-2 w-4/5" />
            </div>
          ) : isError ? (
            <p className="text-xs text-center text-foreground-lighter py-4">
              Failed to load projects
            </p>
          ) : (
            <>
              <CommandEmpty_Shadcn_>
                {search.length > 0 ? 'No projects found' : 'No projects available'}
              </CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {projects.map((project) => {
                  const isSelected = project.ref === selectedRef
                  const isPaused = project.status === 'INACTIVE'

                  return (
                    <CommandItem_Shadcn_
                      key={project.ref}
                      value={`${project.name.replaceAll('"', '')}-${project.ref}`}
                      className="cursor-pointer w-full flex items-center justify-between px-3 py-1.5 text-sm"
                      onSelect={() => onSelect(project)}
                    >
                      <span className="truncate">
                        {project.name}
                        {isPaused && (
                          <Badge className="ml-2" variant="default">
                            Paused
                          </Badge>
                        )}
                      </span>
                      {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                    </CommandItem_Shadcn_>
                  )
                })}
                <div ref={sentinelRef} className="h-1 -mt-1" />
                {hasNextPage && (
                  <div className="px-2 py-1">
                    <ShimmeringLoader className="py-2" />
                  </div>
                )}
              </CommandGroup_Shadcn_>
            </>
          )}
        </CommandList_Shadcn_>
      </Command_Shadcn_>
      {projectCreationEnabled && organizationSlug && (
        <div className="border-t px-2 py-1.5">
          <Link
            href={`/new/${organizationSlug}`}
            onClick={() => onClose()}
            className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground transition-colors px-1 py-1"
          >
            <Plus size={12} strokeWidth={1.5} />
            New project
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Branch column (right) ────────────────────────────────────────────────────

function BranchColumn({
  branches,
  selectedBranch,
  isBranchingEnabled,
  isBranchesLoaded,
  onSelect,
  onCreateBranch,
  onManageBranches,
}: {
  branches: Branch[]
  selectedBranch?: Branch
  isBranchingEnabled: boolean
  isBranchesLoaded: boolean
  onSelect: (branch: Branch) => void
  onCreateBranch: () => void
  onManageBranches: () => void
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
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer',
                        isSelected && 'bg-surface-200'
                      )}
                      onSelect={() => onSelect(branch)}
                    >
                      <span className="truncate flex items-center gap-1.5">
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
      </Command_Shadcn_>
      <div className="border-t px-2 py-1.5 space-y-0.5">
        <button
          type="button"
          onClick={onCreateBranch}
          className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground transition-colors px-1 py-1 w-full"
        >
          <Plus size={12} strokeWidth={1.5} />
          Create branch
        </button>
        {isBranchingEnabled && (
          <button
            type="button"
            onClick={onManageBranches}
            className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground transition-colors px-1 py-1 w-full"
          >
            <ListTree size={12} strokeWidth={1.5} />
            Manage branches
          </button>
        )}
      </div>
    </div>
  )
}
