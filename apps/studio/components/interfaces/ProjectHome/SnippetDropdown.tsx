import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import type { Content } from 'data/content/content-query'
import { SNIPPET_PAGE_LIMIT } from 'data/content/sql-folders-query'
import { Plus } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { editorPanelState } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

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
  const { openSidebar } = useSidebarManagerSnapshot()
  const scrollRootRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const {
    data,
    isPending: isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useContentInfiniteQuery(
    {
      projectRef,
      type: 'sql',
      limit: SNIPPET_PAGE_LIMIT,
      name: search.length === 0 ? search : debouncedSearch,
    },
    { placeholderData: keepPreviousData }
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className={['w-80 p-0', className].filter(Boolean).join(' ')}
      >
        <Command_Shadcn_ shouldFilter={false}>
          <CommandInput_Shadcn_
            showResetIcon
            autoFocus={autoFocus}
            placeholder="Search snippets..."
            value={search}
            onValueChange={setSearch}
            handleReset={() => setSearch('')}
          />
          <CommandList_Shadcn_ ref={scrollRootRef}>
            {isLoading ? (
              <p className="text-xs text-center text-foreground-lighter py-3">Loading...</p>
            ) : search.length > 0 && snippets.length === 0 ? (
              <p className="text-xs text-center text-foreground-lighter py-3">No snippets found</p>
            ) : (
              <CommandGroup_Shadcn_>
                <ScrollArea className={snippets.length > 7 ? 'h-[210px]' : ''}>
                  {snippets.map((snippet) => (
                    <CommandItem_Shadcn_
                      key={snippet.id}
                      value={snippet.id}
                      onSelect={() => onSelect({ id: snippet.id, name: snippet.name })}
                    >
                      {snippet.name}
                    </CommandItem_Shadcn_>
                  ))}
                  <div ref={sentinelRef} className="h-1 -mt-1" />
                  {hasNextPage && (
                    <div className="px-2 py-1">
                      <ShimmeringLoader className="py-2" />
                    </div>
                  )}
                </ScrollArea>
              </CommandGroup_Shadcn_>
            )}

            <div className="h-px bg-border-overlay -mx-1" />

            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                className="cursor-pointer w-full"
                onSelect={() => {
                  setOpen(false)
                  editorPanelState.openAsNew()
                  openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
                }}
              >
                <div className="w-full flex items-center gap-2">
                  <Plus size={14} strokeWidth={1.5} />
                  <p>Create snippet</p>
                </div>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
