'use client'

import { Filter, MessageSquareReply, Search, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Badge,
  Button,
  cn,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import type { ThreadRow } from '~/types/contribute'
import { FilterPopover } from './FilterPopover'
import { DiscordIcon, GitHubIcon, RedditIcon } from './Icons'

function CountSkeleton() {
  return <span className="inline-block min-w-[24px] h-5 bg-surface-300 animate-pulse rounded" />
}

function ThreadsTable({
  threads,
  productArea,
  search,
}: {
  threads: ThreadRow[]
  productArea: string | null
  search: string | null
}) {
  if (threads.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-foreground-lighter">
        No threads found
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full table-fixed min-w-[900px]">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left py-3 px-3 md:px-6 text-sm text-foreground w-[45%]">
                Thread
              </th>
              <th className="text-left py-3 px-3 md:px-6 text-sm text-foreground w-[20%]">Stack</th>
              <th className="text-left py-3 px-3 md:px-6 text-sm text-foreground w-[15%]">
                Posted
              </th>
              <th className="text-left py-3 px-3 md:px-6 text-sm text-foreground w-[10%]">
                Replies
              </th>
            </tr>
          </thead>
          <tbody>
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                productArea={productArea}
                search={search}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-foreground-muted px-3 md:px-6">
        Showing {threads.length} {threads.length === 1 ? 'result' : 'results'}
      </div>
    </div>
  )
}

export function UnansweredThreadsTable({
  threads,
  allProductAreas,
  allStacks,
}: {
  threads: ThreadRow[]
  allProductAreas: string[]
  allStacks: string[]
}) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withOptions({
      shallow: false, // notify server, re-render RSC tree
    })
  )

  const [isPending, startTransition] = useTransition()
  const [channel, setChannel] = useQueryState(
    'channel',
    parseAsString.withDefault('discord').withOptions({
      shallow: false, // notify server, re-render RSC tree
    })
  )
  const [productArea] = useQueryState('product_area', parseAsString)
  const [stack] = useQueryState('stack', parseAsString)

  const validTabs = ['discord', 'reddit', 'github'] as const
  const currentTab = (
    validTabs.includes(channel as (typeof validTabs)[number]) ? channel : 'discord'
  ) as (typeof validTabs)[number]

  // Calculate counts for each channel
  const channelCounts = useMemo(() => {
    return {
      discord: threads.filter((t) => t.channel === 'discord').length,
      reddit: threads.filter((t) => t.channel === 'reddit').length,
      github: threads.filter((t) => t.channel === 'github').length,
    }
  }, [threads])

  async function handleTabChange(value: string) {
    startTransition(async () => {
      await setChannel(value)
    })
  }

  function handleSearchSubmit(e: React.FormEvent) {
    console.log('handleSearchSubmit', searchInput)
    e.preventDefault()
    if (searchInput.trim()) {
      setSearch(searchInput.trim())
    } else {
      setSearch(null)
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchInput.trim()) {
        setSearch(searchInput.trim())
      } else {
        setSearch(null)
      }
    }
  }

  function handleClearSearch() {
    setSearchInput('')
    setSearch(null)
  }

  // Sync local input with URL state
  useEffect(() => {
    setSearchInput(search || '')
  }, [search])

  const filteredThreads = useMemo(() => {
    if (!search || !search.trim()) {
      return threads
    }

    const searchLower = search.toLowerCase()
    return threads.filter((thread) => {
      return (
        thread.title.toLowerCase().includes(searchLower) ||
        thread.user.toLowerCase().includes(searchLower) ||
        (thread.summary && thread.summary.toLowerCase().includes(searchLower))
      )
    })
  }, [threads, search])

  const activeFilterCount = [productArea, stack].filter(Boolean).length

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-16 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl text-foreground">Unresolved threads</h2>
          <p className="text-foreground-lighter">
            From the last 30 days, with data refreshed every 10 minutes.
          </p>
        </div>
      </div>

      {/* Channel Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto">
          <Button
            type={currentTab === 'reddit' ? 'default' : 'dashed'}
            size="tiny"
            onClick={() => handleTabChange('discord')}
            icon={
              <DiscordIcon
                className={cn(
                  'h-4 w-4',
                  currentTab === 'discord' ? 'text-[#5865F2]' : 'text-foreground-lighter'
                )}
              />
            }
            className={cn('w-[118px] justify-start', currentTab === 'discord' && 'bg-surface-300')}
          >
            <span className="flex items-center gap-1.5">
              Discord
              {isPending ? (
                <CountSkeleton />
              ) : (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded min-w-[24px] text-center',
                    currentTab === 'discord'
                      ? 'bg-surface-100 text-foreground'
                      : 'bg-surface-300 text-foreground-lighter'
                  )}
                >
                  {channelCounts.discord}
                </span>
              )}
            </span>
          </Button>
          <Button
            type={currentTab === 'reddit' ? 'default' : 'dashed'}
            size="tiny"
            onClick={() => handleTabChange('reddit')}
            icon={
              <RedditIcon
                className={cn(
                  'h-4 w-4',
                  currentTab === 'reddit' ? 'text-[#FF4500]' : 'text-foreground-lighter'
                )}
              />
            }
            className="w-[115px] justify-start"
          >
            <span className="flex items-center gap-1.5">
              Reddit
              {isPending ? (
                <CountSkeleton />
              ) : (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded min-w-[24px] text-center',
                    currentTab === 'reddit'
                      ? 'bg-surface-100 text-foreground'
                      : 'bg-surface-300 text-foreground-lighter'
                  )}
                >
                  {channelCounts.reddit}
                </span>
              )}
            </span>
          </Button>
          <Button
            type={currentTab === 'github' ? 'default' : 'dashed'}
            size="tiny"
            onClick={() => handleTabChange('github')}
            icon={
              <GitHubIcon
                className={cn(
                  'h-4 w-4',
                  currentTab === 'github' ? 'text-foreground' : 'text-foreground-lighter'
                )}
              />
            }
            className={cn('w-[115px] justify-start', currentTab === 'github' && 'bg-surface-300')}
          >
            <span className="flex items-center gap-1.5">
              GitHub
              {isPending ? (
                <CountSkeleton />
              ) : (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded min-w-[24px] text-center',
                    currentTab === 'github'
                      ? 'bg-surface-100 text-foreground'
                      : 'bg-surface-300 text-foreground-lighter'
                  )}
                >
                  {channelCounts.github}
                </span>
              )}
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end w-full md:w-auto">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-lighter" />
            <Input_Shadcn_
              type="text"
              placeholder="Search threads by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className={cn('pl-10', searchInput && 'pr-10')}
            />
            {searchInput && (
              <Button
                type="text"
                size="tiny"
                icon={<X className="h-4 w-4" />}
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                aria-label="Clear search"
              />
            )}
          </form>

          {/* Filter Button */}
          <FilterPopover
            allProductAreas={allProductAreas}
            allStacks={allStacks}
            trigger={
              <Button type="default" icon={<Filter size={12} />} className="h-8">
                <span className="flex items-center gap-2">
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="bg-black text-white">{activeFilterCount}</Badge>
                  )}
                </span>
              </Button>
            }
          />
        </div>
      </div>
      <ThreadsTable threads={filteredThreads} productArea={productArea} search={search} />
    </section>
  )
}

function ThreadRow({
  thread,
  productArea,
  search,
}: {
  thread: ThreadRow
  productArea: string | null
  search: string | null
}) {
  const [currentProductArea, setProductArea] = useQueryState(
    'product_area',
    parseAsString.withOptions({
      shallow: false,
    })
  )
  const [currentStack, setStack] = useQueryState(
    'stack',
    parseAsString.withOptions({
      shallow: false,
    })
  )

  function handleProductAreaClick(area: string) {
    if (currentProductArea === area) {
      setProductArea(null)
    } else {
      setProductArea(area)
    }
  }

  function handleStackClick(tech: string) {
    if (currentStack === tech) {
      setStack(null)
    } else {
      setStack(tech)
    }
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-3 py-4 md:px-6 w-[45%]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center bg-surface-200 h-10 w-10 rounded-md ">
            {thread.channel === 'discord' && (
              <DiscordIcon
                className={cn(
                  'h-4 w-4',
                  thread.channel === 'discord' ? 'text-[#5865F2]' : 'text-foreground-lighter'
                )}
              />
            )}
            {thread.channel === 'reddit' && (
              <RedditIcon
                className={cn(
                  'h-4 w-4',
                  thread.channel === 'reddit' ? 'text-[#FF4500]' : 'text-foreground-lighter'
                )}
              />
            )}
            {thread.channel === 'github' && (
              <GitHubIcon
                className={cn(
                  'h-4 w-4',
                  thread.channel === 'github' ? 'text-foreground' : 'text-foreground-lighter'
                )}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/contribute/t/${thread.id}`}
              className="block text-foreground truncate hover:underline transition-[text-decoration] duration-100 underline-offset-2"
            >
              {highlightText(thread.title, search)}
            </Link>
            <div className="flex flex-wrap gap-2 overflow-hidden">
              {thread.product_areas.length > 0 &&
                thread.product_areas
                  .filter((area: string) => area !== 'Other')
                  .map((area: string) => {
                    const isActive = productArea === area
                    return (
                      <button key={area} onClick={() => handleProductAreaClick(area)} type="button">
                        <Badge
                          variant={isActive ? 'success' : 'default'}
                          className={cn(
                            // Hover states to indicate interactivity
                            'transition-all duration-150 hover:opacity-70'
                            // 'hover:bg-brand/5 hover:text-brand-600/60 hover:border-brand-500/50,'
                            // isActive
                            //   ? 'hover:bg-brand/5 hover:text-brand-600/60 hover:border-brand-500/50'
                            //   : 'hover:bg-brand hover:text-brand-600 hover:border-brand-500'
                          )}
                        >
                          {area}
                        </Badge>
                      </button>
                    )
                  })}
            </div>
          </div>
        </div>
      </td>
      {/* <td className="py-4 px-3 md:px-6 w-[20%]">
       
      </td> */}
      <td className="py-4 px-3 md:px-6 w-[20%]">
        <div className="flex flex-wrap gap-2 overflow-hidden">
          {thread.stack.length > 0 ? (
            (() => {
              const filteredStack = thread.stack.filter((tech: string) => tech !== 'Other')

              // Check if active stack is in the overflow section
              const overflowStacks = filteredStack.slice(5)
              const hasActiveInOverflow = currentStack && overflowStacks.includes(currentStack)

              return (
                <>
                  {filteredStack.slice(0, 5).map((tech: string) => {
                    const isActive = currentStack === tech
                    return (
                      <button key={tech} onClick={() => handleStackClick(tech)} type="button">
                        <Badge variant={isActive ? 'success' : 'default'}>{tech}</Badge>
                      </button>
                    )
                  })}
                  {filteredStack.length > 5 && (
                    <Popover_Shadcn_>
                      <PopoverTrigger_Shadcn_ asChild>
                        <button type="button">
                          <Badge
                            variant={hasActiveInOverflow ? 'success' : 'default'}
                            className="cursor-pointer hover:bg-surface-300"
                          >
                            +{filteredStack.length - 5}
                          </Badge>
                        </button>
                      </PopoverTrigger_Shadcn_>
                      <PopoverContent_Shadcn_ className="max-w-[300px] p-3">
                        <div className="flex flex-wrap gap-2">
                          {overflowStacks.map((tech: string) => {
                            const isActive = currentStack === tech
                            return (
                              <button
                                key={tech}
                                onClick={() => handleStackClick(tech)}
                                type="button"
                              >
                                <Badge variant={isActive ? 'success' : 'default'}>{tech}</Badge>
                              </button>
                            )
                          })}
                        </div>
                      </PopoverContent_Shadcn_>
                    </Popover_Shadcn_>
                  )}
                </>
              )
            })()
          ) : (
            <p className="text-xs text-foreground-lighter">—</p>
          )}
        </div>
      </td>
      <td className="py-4 px-3 md:px-6 w-[15%]">
        <p className="text-sm text-foreground-lighter whitespace-nowrap">{thread.posted}</p>
      </td>
      {/* Replies */}
      <td className="py-4 px-3 md:px-6 w-[10%]">
        <Link href={`/contribute/t/${thread.id}`} className="flex flex-row items-center gap-2">
          {thread.message_count !== null && thread.message_count !== undefined && (
            <MessageSquareReply size={18} strokeWidth={1.75} className="text-foreground-muted" />
          )}
          <p className="text-sm text-foreground-lighter whitespace-nowrap">
            {thread.message_count !== null && thread.message_count !== undefined
              ? Math.max(0, thread.message_count - 1)
              : '—'}
          </p>
        </Link>
      </td>
    </tr>
  )
}

function highlightText(text: string, searchTerm: string | null): ReactNode {
  if (!searchTerm || !searchTerm.trim()) {
    return text
  }

  const searchLower = searchTerm.toLowerCase()
  const textLower = text.toLowerCase()
  const parts: ReactNode[] = []
  let lastIndex = 0
  let index = textLower.indexOf(searchLower, lastIndex)

  while (index !== -1) {
    // Add text before the match
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    // Add the highlighted match
    parts.push(
      <mark key={index} className="bg-brand-200 dark:bg-brand-300 px-0.5 rounded">
        {text.slice(index, index + searchTerm.length)}
      </mark>
    )
    lastIndex = index + searchTerm.length
    index = textLower.indexOf(searchLower, lastIndex)
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : text
}
