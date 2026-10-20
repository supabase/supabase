import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { HelpCircleIcon } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Checkbox,
  cn,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { MultiSelector, MultiSelectorContent, MultiSelectorTrigger } from 'ui-patterns/multi-select'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  OrgProject,
  useOrgProjectsInfiniteQuery,
} from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export interface SelectedProject {
  ref: string
  name: string
}

export interface OrganizationProjectsMultiSelectProps {
  slug?: string
  selectedRefs: string[]
  onChange: (refs: string[], selected: SelectedProject[]) => void
  /** Seeds the ref -> name lookup so badges render real names before the list has loaded them. */
  knownProjects?: SelectedProject[]
  /** Refs that are currently selected but cannot be deselected (e.g. missing permission). */
  disabledRefs?: string[]
  disabledTooltip?: string
  disabled?: boolean
  error?: string
  searchPlaceholder?: string
  triggerLabel?: string
  /** Replaces the default combobox/badge trigger with a custom one (e.g. a plain "Add new" button). */
  renderTrigger?: () => ReactNode
}

export const OrganizationProjectsMultiSelect = ({
  slug: _slug,
  selectedRefs,
  onChange,
  knownProjects = [],
  disabledRefs = [],
  disabledTooltip = 'Additional permission required to remove this project',
  disabled = false,
  error,
  searchPlaceholder = 'Search project...',
  triggerLabel = 'Select projects...',
  renderTrigger,
}: OrganizationProjectsMultiSelectProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = _slug ?? organization?.slug

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '0px',
  })

  const {
    data,
    error: projectsError,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOrgProjectsInfiniteQuery(
    { slug, search: search.length === 0 ? search : debouncedSearch },
    { enabled: open, placeholderData: keepPreviousData }
  )

  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects) ?? [], [data?.pages])

  // Accumulate ref -> name across every page we've ever seen so badges can always render a
  // name, even for a ref that's since scrolled out of the current search results.
  const [seenNamesByRef, setSeenNamesByRef] = useState<Record<string, string>>({})
  const knownNamesByRef = Object.fromEntries(knownProjects.map((p) => [p.ref, p.name]))
  const getProjectName = (ref: string) => knownNamesByRef[ref] ?? seenNamesByRef[ref] ?? ref

  const toSelected = (refs: string[]): SelectedProject[] =>
    refs.map((ref) => ({ ref, name: getProjectName(ref) }))

  // Badge deletion and keyboard removal go through the generic multi-select's own
  // onValuesChange, which has no concept of a non-removable ref — reinstate any that
  // got removed so permission-locked projects can't be dropped this way either.
  const handleValuesChange = (nextRefs: string[]) => {
    const preserved = disabledRefs.filter((ref) => !nextRefs.includes(ref))
    const merged =
      preserved.length === 0 ? nextRefs : Array.from(new Set([...nextRefs, ...preserved]))
    onChange(merged, toSelected(merged))
  }

  const handleToggleProject = (project: OrgProject) => {
    if (disabledRefs.includes(project.ref)) return
    const next = selectedRefs.includes(project.ref)
      ? selectedRefs.filter((ref) => ref !== project.ref)
      : [...selectedRefs, project.ref]
    onChange(next, toSelected(next))
  }

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
              <HelpCircleIcon size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom">Error: {projectsError?.message}</TooltipContent>
          </Tooltip>
        </div>
      )
    }
    if (projects.length === 0) {
      return (
        <p className="text-xs text-center text-foreground-lighter py-3">
          {search.length > 0 ? 'No projects found based on your search' : 'No projects found'}
        </p>
      )
    }
    return (
      <ScrollArea className={projects.length > 7 ? 'h-full md:h-[210px]' : ''}>
        {projects.map((project) => {
          const isSelected = selectedRefs.includes(project.ref)
          const isLocked = isSelected && disabledRefs.includes(project.ref)

          const row = (
            <CommandItem
              key={project.ref}
              value={`${project.name.replaceAll('"', '')}-${project.ref}`}
              disabled={isLocked}
              className={cn(
                'cursor-pointer w-full flex items-center gap-x-2',
                isLocked && 'cursor-not-allowed opacity-50'
              )}
              onSelect={() => handleToggleProject(project)}
            >
              <Checkbox checked={isSelected} disabled={isLocked} className="pointer-events-none" />
              <span className="truncate">{project.name}</span>
            </CommandItem>
          )

          return isLocked ? (
            <Tooltip key={project.ref}>
              <TooltipTrigger asChild>
                <div>{row}</div>
              </TooltipTrigger>
              <TooltipContent side="right">{disabledTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            row
          )
        })}
        <div ref={sentinelRef} className="h-1 -mt-1" />
        {hasNextPage && (
          <div className="px-2 py-1">
            <ShimmeringLoader className="py-2" />
          </div>
        )}
      </ScrollArea>
    )
  }

  useEffect(() => {
    if (projects.length === 0) return
    setSeenNamesByRef((prev) => {
      let changed = false
      const next = { ...prev }
      for (const p of projects) {
        if (next[p.ref] !== p.name) {
          next[p.ref] = p.name
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [projects])

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

  const popoverBody = (
    <>
      <CommandInput
        showResetIcon
        value={search}
        onValueChange={setSearch}
        placeholder={searchPlaceholder}
        handleReset={() => setSearch('')}
        className="text-base sm:text-sm"
      />
      <CommandList className="max-h-none md:max-h-[300px] overflow-y-auto overflow-x-hidden">
        <CommandGroup>{renderListContent()}</CommandGroup>
      </CommandList>
    </>
  )

  if (renderTrigger) {
    return (
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="end">
            <Command shouldFilter={false}>{popoverBody}</Command>
          </PopoverContent>
        </Popover>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <MultiSelector
        values={selectedRefs}
        onValuesChange={handleValuesChange}
        onOpenChange={setOpen}
        shouldFilter={false}
        disabled={disabled}
      >
        <MultiSelectorTrigger label={triggerLabel} badgeLimit={4} renderValue={getProjectName} />
        <MultiSelectorContent>{popoverBody}</MultiSelectorContent>
      </MultiSelector>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
