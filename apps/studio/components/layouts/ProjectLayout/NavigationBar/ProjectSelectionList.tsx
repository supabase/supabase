import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { OrgProject, useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export function ProjectSelectionList({
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

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-w-0">
        <ShimmeringLoader className="py-2" />
        <ShimmeringLoader className="py-2 w-4/5" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col flex-1 min-w-0">
        <p className="text-xs text-center text-foreground-lighter py-4">Failed to load projects</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <CommandEmpty_Shadcn_>
        {search.length > 0 ? 'No projects found' : 'No projects available'}
      </CommandEmpty_Shadcn_>
    )
  }
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
          <CommandGroup_Shadcn_>
            {projects.map((project) => {
              const isSelected = project.ref === selectedRef
              const isPaused = project.status === 'INACTIVE'

              return (
                <CommandItem_Shadcn_
                  key={project.ref}
                  value={`${project.name.replaceAll('"', '')}-${project.ref}`}
                  className="cursor-pointer w-full flex items-center justify-between px-3 py-1.5 text-lg"
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
