import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { OrgProject, useOrgProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Check, HelpCircle } from 'lucide-react'
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import {
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
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

interface OrganizationProjectSelectorSelectorProps {
  open?: boolean
  actions?: ReactNode
  selectedRef?: string
  searchPlaceholder?: string
  sameWidthAsTrigger?: boolean
  setOpen?: (value: boolean) => void
  renderRow?: (project: OrgProject) => ReactNode
  onSelect?: (project: OrgProject) => void
}

export const OrganizationProjectSelector = ({
  open: _open,
  setOpen: _setOpen,
  actions,
  selectedRef,
  searchPlaceholder = 'Find project...',
  sameWidthAsTrigger = false,
  children,
  renderRow,
  onSelect,
}: PropsWithChildren<OrganizationProjectSelectorSelectorProps>) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const [openInternal, setOpenInternal] = useState(false)
  const open = _open ?? openInternal
  const setOpen = _setOpen ?? setOpenInternal

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
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOrgProjectsInfiniteQuery(
    { slug, search: search.length === 0 ? search : debouncedSearch },
    { keepPreviousData: true }
  )

  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects), [data?.pages]) || []

  useEffect(() => {
    if (
      !isLoadingProjects &&
      !isFetching &&
      entry?.isIntersecting &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoadingProjects
    ) {
      console.log('fetch')
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

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        {children ?? <p className="text-sm text-foreground-light">Children to be provided</p>}
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        sameWidthAsTrigger={sameWidthAsTrigger}
        className="p-0"
        side="bottom"
        align="start"
      >
        <Command_Shadcn_ shouldFilter={false}>
          <CommandInput_Shadcn_
            showResetIcon
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            handleReset={() => setSearch('')}
          />
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              {isLoadingProjects ? (
                <>
                  <div className="px-2 py-1">
                    <ShimmeringLoader className="py-2" />
                  </div>
                  <div className="px-2 py-1 w-4/5">
                    <ShimmeringLoader className="py-2" />
                  </div>
                </>
              ) : isErrorProjects ? (
                <div className="flex items-center gap-x-2 py-3 justify-center">
                  <p className="text-xs text-foreground-lighter">Failed to retrieve projects</p>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle size={14} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Error: {projectsError?.message}</TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <>
                  {search.length > 0 && projects.length === 0 && (
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No projects found based on your search
                    </p>
                  )}
                  <ScrollArea className={(projects || []).length > 7 ? 'h-[210px]' : ''}>
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
                      >
                        {!!renderRow ? (
                          renderRow(project)
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            {project.name}
                            {project.ref === selectedRef && <Check size={16} />}
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
                </>
              )}
            </CommandGroup_Shadcn_>
            {!!actions && (
              <>
                {/* [Joshen] Not using CommandSeparator to persist this while searching */}
                <div className="h-px bg-border-overlay -mx-1" />
                {actions}
              </>
            )}
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
