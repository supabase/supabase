import { useIntersectionObserver } from '@uidotdev/usehooks'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import type { Content } from 'data/content/content-query'
import { SNIPPET_PAGE_LIMIT } from 'data/content/sql-folders-query'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'ui'

type SnippetDropdownProps = {
  projectRef?: string
  trigger: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
  autoFocus?: boolean
  onSelect: (snippet: { id: string; name: string }) => void
}

type SqlContentItem = Extract<Content, { type: 'sql' }>

export const SnippetDropdown = ({
  projectRef,
  trigger,
  side = 'bottom',
  align = 'end',
  className,
  autoFocus = false,
  onSelect,
}: SnippetDropdownProps) => {
  const [snippetSearch, setSnippetSearch] = useState('')
  const scrollRootRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useContentInfiniteQuery(
      {
        projectRef,
        type: 'sql',
        limit: SNIPPET_PAGE_LIMIT,
        name: snippetSearch.length === 0 ? undefined : snippetSearch,
      },
      { keepPreviousData: true }
    )

  const snippets = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.content) ?? []
    return items as SqlContentItem[]
  }, [data?.pages])

  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className={['w-80 p-0', className].filter(Boolean).join(' ')}
      >
        <Command_Shadcn_ shouldFilter={false}>
          <CommandInput_Shadcn_
            autoFocus={autoFocus}
            placeholder="Search snippets..."
            value={snippetSearch}
            onValueChange={setSnippetSearch}
          />
          <CommandList_Shadcn_ ref={scrollRootRef}>
            {isLoading ? (
              <CommandEmpty_Shadcn_>Loading...</CommandEmpty_Shadcn_>
            ) : snippets.length === 0 ? (
              <CommandEmpty_Shadcn_>No snippets found</CommandEmpty_Shadcn_>
            ) : null}
            <CommandGroup_Shadcn_>
              {snippets.map((snippet) => (
                <CommandItem_Shadcn_
                  key={snippet.id}
                  onSelect={() => onSelect({ id: snippet.id, name: snippet.name })}
                >
                  {snippet.name}
                </CommandItem_Shadcn_>
              ))}
              <div ref={sentinelRef} className="h-1" />
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
