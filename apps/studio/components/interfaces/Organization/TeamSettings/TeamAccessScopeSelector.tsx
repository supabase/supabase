import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Button,
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
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  ALL_PROJECTS_ACCESS_SCOPE,
  ALL_PROJECTS_ACCESS_SCOPE_LABEL,
  getAccessScopeLabel,
  getSelectedProjectRefs,
  isAllProjectsAccessScope,
  toggleProjectInAccessScope,
  type TeamAccessScopeSelection,
} from './TeamAccessScope.utils'
import {
  useOrgProjectsInfiniteQuery,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

type TeamAccessScopeSelectorProps = {
  value: TeamAccessScopeSelection
  onChange: (accessScope: TeamAccessScopeSelection) => void
  slug?: string
  open?: boolean
  setOpen?: (open: boolean) => void
  fetchOnMount?: boolean
  sameWidthAsTrigger?: boolean
  checkPosition?: 'right' | 'left'
  searchPlaceholder?: string
  onInitialLoad?: (projects: OrgProject[]) => void
  disabled?: boolean
  allowMultipleProjects?: boolean
}

export function TeamAccessScopeSelector({
  value,
  onChange,
  slug: slugProp,
  open: openProp,
  setOpen: setOpenProp,
  fetchOnMount = true,
  sameWidthAsTrigger = true,
  checkPosition = 'left',
  searchPlaceholder = 'Search projects...',
  onInitialLoad,
  disabled = false,
  allowMultipleProjects = true,
}: TeamAccessScopeSelectorProps) {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = slugProp ?? organization?.slug

  const [openInternal, setOpenInternal] = useState(false)
  const open = openProp ?? openInternal
  const setOpen = setOpenProp ?? setOpenInternal
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
    isLoading: isLoadingProjects,
    isSuccess: isSuccessProjects,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOrgProjectsInfiniteQuery(
    { slug, search: search.length === 0 ? search : debouncedSearch },
    { enabled: fetchOnMount || open, placeholderData: keepPreviousData }
  )

  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects) ?? [], [data?.pages])
  const selectedProjectRefs = getSelectedProjectRefs(value)
  const triggerLabel = getAccessScopeLabel(value, projects)

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
    if (!isLoadingProjects && isSuccessProjects) {
      onInitialLoad?.(projects)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProjects, isSuccessProjects])

  const showAllProjectsOption =
    search.length === 0 ||
    ALL_PROJECTS_ACCESS_SCOPE_LABEL.toLowerCase().includes(search.toLowerCase())

  const handleProjectSelect = (projectRef: string) => {
    if (!allowMultipleProjects) {
      onChange([projectRef])
      setOpen(false)
      return
    }

    onChange(toggleProjectInAccessScope(value, projectRef))
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          block
          variant="default"
          role="combobox"
          size="small"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listboxId}
          className="justify-between"
          iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        >
          {isLoadingProjects || isFetching ? (
            <ShimmeringLoader className="w-44 py-2" />
          ) : (
            triggerLabel
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id={listboxId}
        sameWidthAsTrigger={sameWidthAsTrigger}
        className="p-0"
        side="bottom"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            showResetIcon
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            handleReset={() => setSearch('')}
            className="text-base sm:text-sm"
          />
          <CommandList className="max-h-none md:max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandGroup>
              {isLoadingProjects ? (
                <>
                  <div className="px-2 py-1">
                    <ShimmeringLoader className="py-2" />
                  </div>
                  <div className="px-2 py-1 w-4/5">
                    <ShimmeringLoader className="py-2" />
                  </div>
                </>
              ) : (
                <>
                  {showAllProjectsOption && (
                    <CommandItem
                      value={ALL_PROJECTS_ACCESS_SCOPE}
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        onChange(ALL_PROJECTS_ACCESS_SCOPE)
                        setOpen(false)
                      }}
                    >
                      <div
                        className={cn(
                          'w-full flex items-center',
                          checkPosition === 'left' ? 'gap-x-2' : 'justify-between',
                          !isAllProjectsAccessScope(value) && checkPosition === 'left' && 'ml-6'
                        )}
                      >
                        {checkPosition === 'left' && isAllProjectsAccessScope(value) && (
                          <Check size={16} />
                        )}
                        <span>{ALL_PROJECTS_ACCESS_SCOPE_LABEL}</span>
                        {checkPosition === 'right' && isAllProjectsAccessScope(value) && (
                          <Check size={16} />
                        )}
                      </div>
                    </CommandItem>
                  )}
                  {projects.length === 0 && search.length > 0 ? (
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No projects found based on your search
                    </p>
                  ) : (
                    <ScrollArea
                      className={projects.length > 7 ? 'h-full md:h-[210px]' : ''}
                      ref={scrollRootRef}
                    >
                      {projects.map((project) => {
                        const isSelected = selectedProjectRefs.includes(project.ref)

                        return (
                          <CommandItem
                            key={project.ref}
                            value={`${project.name.replaceAll('"', '')}-${project.ref}`}
                            className="cursor-pointer w-full"
                            onSelect={() => handleProjectSelect(project.ref)}
                          >
                            <div
                              className={cn(
                                'w-full flex items-center',
                                checkPosition === 'left' ? 'gap-x-2' : 'justify-between',
                                !isSelected && checkPosition === 'left' && 'ml-6'
                              )}
                            >
                              {checkPosition === 'left' && isSelected && <Check size={16} />}
                              <span className="truncate">{project.name}</span>
                              {checkPosition === 'right' && isSelected && <Check size={16} />}
                            </div>
                          </CommandItem>
                        )
                      })}
                      <div ref={sentinelRef} className="h-1 -mt-1" />
                      {hasNextPage && (
                        <div className="px-2 py-1">
                          <ShimmeringLoader className="py-2" />
                        </div>
                      )}
                    </ScrollArea>
                  )}
                  {allowMultipleProjects && selectedProjectRefs.length > 0 && (
                    <div className="border-t px-3 py-2">
                      <Button
                        size="tiny"
                        variant="default"
                        className="w-full"
                        onClick={() => setOpen(false)}
                      >
                        Done ({selectedProjectRefs.length} selected)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
