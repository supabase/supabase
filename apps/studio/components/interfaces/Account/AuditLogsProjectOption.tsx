import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { useEffect, useMemo, useState } from 'react'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from 'ui'
import type { CustomOptionProps } from 'ui-patterns/FilterBar'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  useProjectsInfiniteQuery,
  type ProjectInfoInfinite,
} from '@/data/projects/projects-infinite-query'

interface AuditLogsProjectOptionProps extends CustomOptionProps {
  onSelectProject: (project: ProjectInfoInfinite) => void
}

// Select-only project list for the FilterBar. The stored value is the project ref, while the
// chip shows the name through the property's `formatValue`.
export const AuditLogsProjectOption = ({
  onChange,
  onSelectProject,
}: AuditLogsProjectOptionProps) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [sentinelRef, entry] = useIntersectionObserver({ threshold: 0, rootMargin: '0px' })

  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProjectsInfiniteQuery(
    { search: search.length === 0 ? search : debouncedSearch },
    { placeholderData: keepPreviousData }
  )
  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects) ?? [], [data?.pages])

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage])

  const handleSelect = (project: ProjectInfoInfinite) => {
    onSelectProject(project)
    onChange(project.ref)
  }

  return (
    <Command shouldFilter={false}>
      <CommandInput
        showResetIcon
        value={search}
        onValueChange={setSearch}
        placeholder="Find project..."
        handleReset={() => setSearch('')}
        className="text-base sm:text-sm"
        // FilterBar keeps focus on the chip's input, so move it here for cmdk's arrow/enter keys
        autoFocus
      />
      <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
        <CommandGroup>
          {isLoading && (
            <div className="px-2 py-1">
              <ShimmeringLoader className="py-2" />
            </div>
          )}
          {isError && (
            <p className="text-xs text-center text-foreground-lighter py-3">
              Failed to retrieve projects: {error.message}
            </p>
          )}
          {isSuccess && projects.length === 0 && (
            <p className="text-xs text-center text-foreground-lighter py-3">
              {search.length > 0 ? 'No projects found based on your search' : 'No projects found'}
            </p>
          )}
          {isSuccess &&
            projects.map((project) => (
              <CommandItem
                key={project.ref}
                value={`${project.name.replaceAll('"', '')}-${project.ref}`}
                className="cursor-pointer w-full"
                onSelect={() => handleSelect(project)}
              >
                {project.name}
              </CommandItem>
            ))}
          <div ref={sentinelRef} className="h-1 -mt-1" />
          {hasNextPage && (
            <div className="px-2 py-1">
              <ShimmeringLoader className="py-2" />
            </div>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

// FilterBar invokes `component(props)` as a plain function, so this factory returns that function
// with `onSelectProject` bound, keeping the component itself defined at module level.
export const createAuditLogsProjectOption = (
  onSelectProject: AuditLogsProjectOptionProps['onSelectProject']
) => {
  const renderProjectOption = (props: CustomOptionProps) => (
    <AuditLogsProjectOption {...props} onSelectProject={onSelectProject} />
  )
  return renderProjectOption
}
