import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { OrgProject, useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Check, ChevronsUpDown, HelpCircle } from 'lucide-react'
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

interface OrganizationProjectSelectorSelectorProps {
  slug?: string
  open?: boolean
  selectedRef?: string | null
  searchPlaceholder?: string
  sameWidthAsTrigger?: boolean
  checkPosition?: 'right' | 'left'
  setOpen?: (value: boolean) => void
  renderRow?: (project: OrgProject) => ReactNode
  renderTrigger?: ({
    isLoading,
    project,
    listboxId,
    open,
  }: {
    isLoading: boolean
    project?: OrgProject
    listboxId: string
    open: boolean
  }) => ReactNode
  /** When embedded, call with setOpen and { embedded: true } to render top action row (horizontal buttons). */
  renderActions?: (setOpen: (value: boolean) => void, options?: { embedded?: boolean }) => ReactNode
  onSelect?: (project: OrgProject) => void
  onInitialLoad?: (projects: OrgProject[]) => void
  isOptionDisabled?: (project: OrgProject) => boolean
  fetchOnMount?: boolean
  modal?: boolean
  /** When true, render only the command list (no popover/trigger). For use inside sheet or popover. */
  embedded?: boolean
  /** Applied to the root when embedded. Use e.g. "bg-transparent" to inherit sheet background. */
  className?: string
}

export const OrganizationProjectSelector = ({
  slug: _slug,
  open: _open,
  setOpen: _setOpen,
  selectedRef,
  searchPlaceholder = 'Find project...',
  sameWidthAsTrigger = false,
  checkPosition = 'right',
  renderRow,
  renderTrigger,
  renderActions,
  onSelect,
  onInitialLoad,
  isOptionDisabled,
  fetchOnMount = false,
  modal = false,
  embedded = false,
  className,
}: OrganizationProjectSelectorSelectorProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = _slug ?? organization?.slug

  const [openInternal, setOpenInternal] = useState(false)
  const open = _open ?? openInternal
  const setOpen = _setOpen ?? setOpenInternal
  const listboxId = useId()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  const {
    data,
    error: projectsError,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    isSuccess: isSuccessProjects,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOrgProjectsInfiniteQuery(
    { slug, search: search.length === 0 ? search : debouncedSearch },
    { enabled: fetchOnMount || open, placeholderData: keepPreviousData }
  )

  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects), [data?.pages]) || []
  const selectedProject = projects.find((p) => p.ref === selectedRef)

  useEffect(() => {
    if (
      !isLoadingProjects &&
      !isFetching &&
      entry?.isIntersecting &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    entry?.isIntersecting,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoadingProjects,
    fetchNextPage,
  ])

  useEffect(() => {
    // isLoadingProjects is true only during initial load. If the variables for the query change (slug), isLoadingProjects
    // will be true again.
    if (!isLoadingProjects && isSuccessProjects) {
      onInitialLoad?.(projects)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProjects, isSuccessProjects])

  function renderListContent() {
    if (isLoadingProjects) {
      return (
        <>
          <div className="px-2 py-1">
            <ShimmeringLoader className="py-2" />
          </div>
          <div className="px-2 py-1 w-4/5">
            <ShimmeringLoader className="py-2" />
          </div>
        </>
      )
    }
    if (isErrorProjects) {
      return (
        <div className="flex items-center gap-x-2 py-3 justify-center">
          <p className="text-xs text-foreground-lighter">Failed to retrieve projects</p>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom">Error: {projectsError?.message}</TooltipContent>
          </Tooltip>
        </div>
      )
    }
    if (search.length > 0 && projects.length === 0) {
      return (
        <p className="text-xs text-center text-foreground-lighter py-3">
          No projects found based on your search
        </p>
      )
    }
    if (projects.length === 0) {
      return <p className="text-xs text-center text-foreground-lighter py-3">No projects found</p>
    }
    if (embedded) {
      return (
        <div className="min-h-0 p-1">
          {projects?.map((project) => (
            <CommandItem_Shadcn_
              key={project.ref}
              value={`${project.name.replaceAll('"', '')}-${project.ref}`}
              className="cursor-pointer w-full"
              onSelect={() => {
                onSelect?.(project)
                setOpen(false)
              }}
              onClick={() => setOpen(false)}
              disabled={!!isOptionDisabled ? isOptionDisabled(project) : false}
            >
              {!!renderRow ? (
                renderRow(project)
              ) : (
                <div
                  className={cn(
                    'w-full flex items-center',
                    checkPosition === 'left' ? 'gap-x-2' : 'justify-between',
                    project.ref !== selectedRef && checkPosition === 'left' && 'ml-6'
                  )}
                >
                  {checkPosition === 'left' && project.ref === selectedRef && <Check size={16} />}
                  {project.name}
                  {checkPosition === 'right' && project.ref === selectedRef && <Check size={16} />}
                </div>
              )}
            </CommandItem_Shadcn_>
          ))}
          <div ref={sentinelRef} className="h-1 -mt-1" />
          {hasNextPage && (
            <div className="px-2 py-1">
              <ShimmeringLoader className="py-2" />
            </div>
          )}
        </div>
      )
    }
    return (
      <ScrollArea className={(projects || []).length > 7 ? 'h-full md:h-[210px]' : ''}>
        {projects?.map((project) => (
          <CommandItem_Shadcn_
            key={project.ref}
            value={`${project.name.replaceAll('"', '')}-${project.ref}`}
            className="cursor-pointer w-full"
            onSelect={() => {
              onSelect?.(project)
              setOpen(false)
            }}
            onClick={() => setOpen(false)}
            disabled={!!isOptionDisabled ? isOptionDisabled(project) : false}
          >
            {!!renderRow ? (
              renderRow(project)
            ) : (
              <div
                className={cn(
                  'w-full flex items-center',
                  checkPosition === 'left' ? 'gap-x-2' : 'justify-between',
                  project.ref !== selectedRef && checkPosition === 'left' && 'ml-6'
                )}
              >
                {checkPosition === 'left' && project.ref === selectedRef && <Check size={16} />}
                {project.name}
                {checkPosition === 'right' && project.ref === selectedRef && <Check size={16} />}
              </div>
            )}
          </CommandItem_Shadcn_>
        ))}
        <div ref={sentinelRef} className="h-1 -mt-1" />
        {hasNextPage && (
          <div className="px-2 py-1">
            <ShimmeringLoader className="py-2" />
          </div>
        )}
      </ScrollArea>
    )
  }

  const commandContent = (
    <Command_Shadcn_
      shouldFilter={false}
      className={cn(className, embedded && 'flex flex-col flex-1 min-h-0 overflow-hidden')}
    >
      {embedded && !!renderActions && (
        <div className="flex items-center gap-2 shrink-0 border-b p-2">
          {renderActions(setOpen, { embedded: true })}
        </div>
      )}
      <CommandInput_Shadcn_
        showResetIcon
        value={search}
        onValueChange={setSearch}
        placeholder={searchPlaceholder}
        handleReset={() => setSearch('')}
        wrapperClassName={embedded ? 'shrink-0 border-b' : undefined}
        className="text-base sm:text-sm"
      />
      <CommandList_Shadcn_
        className={
          embedded
            ? 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden !max-h-none'
            : 'max-h-none md:max-h-[300px] overflow-y-auto overflow-x-hidden'
        }
      >
        <CommandGroup_Shadcn_ className={embedded ? 'flex-1 min-h-0 overflow-hidden' : ''}>
          {renderListContent()}
        </CommandGroup_Shadcn_>
        {!!renderActions && !embedded && (
          <>
            <div className="h-px bg-border-overlay -mx-1 shrink-0" />
            {renderActions(setOpen)}
          </>
        )}
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )

  if (embedded) {
    return commandContent
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger_Shadcn_ asChild>
        {renderTrigger ? (
          renderTrigger({
            isLoading: isLoadingProjects || isFetching,
            project: selectedProject,
            listboxId,
            open,
          })
        ) : (
          <Button
            block
            type="default"
            role="combobox"
            size="small"
            aria-expanded={open}
            aria-controls={listboxId}
            className="justify-between"
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          >
            {isLoadingProjects || isFetching ? (
              <ShimmeringLoader className="w-44 py-2" />
            ) : (
              selectedProject?.name ?? 'Select a project'
            )}
          </Button>
        )}
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        id={listboxId}
        sameWidthAsTrigger={sameWidthAsTrigger}
        className="p-0"
        side="bottom"
        align="start"
      >
        {commandContent}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
