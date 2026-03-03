'use client'

import { Filter, MessageSquareReply, Search, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Badge,
  Button,
  Card,
  cn,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import type { ThreadRow } from '~/types/contribute'
import { FilterPopover } from './FilterPopover'
import { DiscordIcon, GitHubIcon, RedditIcon } from './Icons'

interface TabConfig {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
}

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
  return (
    <Card>
      <Table className="w-full mt-0">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>Thread</TableHead>
            <TableHead>Stack</TableHead>
            <TableHead>Replies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {threads.length === 0 ? (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3} className="text-center text-foreground-lighter py-6">
                No threads found
              </TableCell>
            </TableRow>
          ) : (
            threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                productArea={productArea}
                search={search}
              />
            ))
          )}
        </TableBody>
        <TableCaption>
          Showing {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
        </TableCaption>
      </Table>
    </Card>
  )
}

export function UnansweredThreadsTable({
  threads: initialThreads,
  channelCounts,
  allProductAreas,
  allStacks,
}: {
  threads: ThreadRow[]
  channelCounts: { all: number; discord: number; reddit: number; github: number }
  allProductAreas: string[]
  allStacks: string[]
}) {
  const [threads, setThreads] = useState(initialThreads)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialThreads.length === 100)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withOptions({
      shallow: false, // notify server, re-render RSC tree
    })
  )

  const [_, startTransition] = useTransition()
  const [channel, setChannel] = useQueryState(
    'channel',
    parseAsString.withDefault('all').withOptions({
      shallow: false, // notify server, re-render RSC tree
    })
  )
  const [productArea] = useQueryState('product_area', parseAsString)
  const [stack] = useQueryState('stack', parseAsString)

  const tabs: TabConfig[] = [
    {
      id: 'all',
      label: 'All',
    },
    {
      id: 'discord',
      label: 'Discord',
      icon: DiscordIcon,
      iconColor: 'text-[#5865F2]',
    },
    {
      id: 'reddit',
      label: 'Reddit',
      icon: RedditIcon,
      iconColor: 'text-[#FF4500]',
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: GitHubIcon,
      iconColor: 'text-foreground',
    },
  ]

  const validTabs = ['all', 'discord', 'reddit', 'github'] as const
  const currentTab = (
    validTabs.includes(channel as (typeof validTabs)[number]) ? channel : 'all'
  ) as (typeof validTabs)[number]

  // Reset threads when filters change
  useEffect(() => {
    setThreads(initialThreads)
    setHasMore(initialThreads.length === 100)
  }, [initialThreads])

  async function handleTabChange(value: string) {
    startTransition(async () => {
      await setChannel(value)
    })
  }

  async function handleLoadMore() {
    setIsLoadingMore(true)
    try {
      const params = new URLSearchParams()
      params.set('offset', threads.length.toString())
      if (channel && channel !== 'all') params.set('channel', channel)
      if (productArea) params.set('product_area', productArea)
      if (stack) params.set('stack', stack)
      if (search) params.set('search', search)

      const response = await fetch(`/api-v2/contribute/threads?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Failed to load threads: ${response.status} ${response.statusText}`,
        }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const newThreads = await response.json()

      if (!Array.isArray(newThreads)) {
        throw new Error('Invalid response format: expected an array of threads')
      }

      if (newThreads.length < 100) {
        setHasMore(false)
      }

      setThreads((prev) => [...prev, ...newThreads])
    } catch (error) {
      console.error('Error loading more threads:', error)
      // Optionally show user-facing error message
      // You could add a toast notification or error state here
    } finally {
      setIsLoadingMore(false)
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
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
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl text-foreground">Unresolved threads</h2>
          <p className="text-foreground-lighter">
            Over the last 30 days, with data refreshed every 10 minutes.
          </p>
        </div>
      </header>

      {/* Channel Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center flex-wrap gap-x-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            const Icon = tab.icon

            return (
              <Button
                key={tab.id}
                type={isActive ? 'default' : 'dashed'}
                size="tiny"
                onClick={() => handleTabChange(tab.id)}
                icon={
                  Icon ? (
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? tab.iconColor : 'text-foreground-lighter'
                      )}
                    />
                  ) : undefined
                }
                className={cn('w-fit justify-start', isActive && 'bg-surface-300')}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  <span className={cn('text-xs pl-1.5 min-w-[24px] text-center tabular-nums')}>
                    {channelCounts[tab.id as keyof typeof channelCounts]}
                  </span>
                </span>
              </Button>
            )
          })}
        </div>

        <div className="flex items-center gap-x-1.5 flex-1 md:justify-end w-full md:w-auto">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative md:max-w-xs w-full flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-lighter" />
            <Input_Shadcn_
              type="text"
              size="tiny"
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
                className="absolute right-2 px-1 top-1/2 transform -translate-y-1/2"
                aria-label="Clear search"
              />
            )}
          </form>

          {/* Filter Button */}
          <FilterPopover
            allProductAreas={allProductAreas}
            allStacks={allStacks}
            trigger={
              <Button type="default" icon={<Filter size={12} />}>
                <span className="flex items-center gap-2">
                  Filters
                  {activeFilterCount > 0 && (
                    <div className="flex items-center justify-center text-[10px] font-medium w-4 h-4 rounded-full text-center bg-black dark:bg-white text-contrast">
                      {activeFilterCount}
                    </div>
                  )}
                </span>
              </Button>
            }
          />
        </div>
      </div>
      <ThreadsTable threads={filteredThreads} productArea={productArea} search={search} />
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            type="default"
            size="tiny"
            onClick={handleLoadMore}
            loading={isLoadingMore}
            disabled={isLoadingMore}
          >
            Load more
          </Button>
        </div>
      )}
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
    <TableRow className="relative group [&.hovering-badge>td]:hover:!bg-transparent">
      {/* Thread title and product areas */}
      <TableCell className="w-auto max-w-[600px]">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Channel icon */}
          <div className="flex items-center justify-center bg-surface-200 h-10 w-10 rounded-md">
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
          <div className="min-w-0 flex-1 flex flex-col gap-y-0.5">
            {/* Thread title */}
            <h3 className="text-base text-foreground truncate transition-[text-decoration] duration-100 underline-offset-2">
              {highlightText(thread.title, search)}
            </h3>
            {/* Posted time and product areas */}
            <div className="flex flex-row items-baseline gap-2 overflow-hidden">
              {/* Posted time */}
              <p className="text-xs text-foreground-lighter whitespace-nowrap">{thread.posted}</p>
              {/* Product areas */}
              {thread.product_areas.length > 0 &&
                (() => {
                  const filteredAreas = thread.product_areas.filter(
                    (area: string) => area !== 'Other'
                  )
                  return filteredAreas.length > 0 ? (
                    <div
                      onMouseEnter={(e) => {
                        const row = e.currentTarget.closest('tr')
                        row?.classList.remove('group')
                        row?.classList.add('hovering-badge')
                      }}
                      onMouseLeave={(e) => {
                        const row = e.currentTarget.closest('tr')
                        row?.classList.add('group')
                        row?.classList.remove('hovering-badge')
                      }}
                      className="flex flex-wrap gap-x-1.5 gap-y-1 overflow-hidden"
                    >
                      {filteredAreas.map((area: string) => {
                        const isActive = productArea === area
                        return (
                          <button
                            key={area}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleProductAreaClick(area)
                            }}
                            type="button"
                            className="relative z-10"
                          >
                            <Badge
                              variant={isActive ? 'success' : 'default'}
                              className="transition-all duration-150 hover:bg-brand-300/30 dark:hover:bg-brand-300/80"
                            >
                              {area}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  ) : null
                })()}
            </div>
          </div>
        </div>
      </TableCell>
      {/* Stack */}
      <TableCell className="w-[300px]">
        <div
          onMouseEnter={(e) => {
            const row = e.currentTarget.closest('tr')
            row?.classList.remove('group')
            row?.classList.add('hovering-badge')
          }}
          onMouseLeave={(e) => {
            const row = e.currentTarget.closest('tr')
            row?.classList.add('group')
            row?.classList.remove('hovering-badge')
          }}
          className="flex flex-wrap gap-x-1.5 gap-y-0.5 overflow-hidden"
        >
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
                      <button
                        key={tech}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleStackClick(tech)
                        }}
                        type="button"
                        className="relative z-10"
                      >
                        <Badge
                          variant={isActive ? 'success' : 'default'}
                          className="transition-all duration-150 hover:bg-brand-300/30 dark:hover:bg-brand-300/80"
                        >
                          {tech}
                        </Badge>
                      </button>
                    )
                  })}
                  {filteredStack.length > 5 && (
                    <Popover_Shadcn_>
                      <PopoverTrigger_Shadcn_ asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onMouseEnter={(e) => {
                            const row = e.currentTarget.closest('tr')
                            row?.classList.remove('group')
                            row?.classList.add('hovering-badge')
                          }}
                          onMouseLeave={(e) => {
                            const row = e.currentTarget.closest('tr')
                            row?.classList.add('group')
                            row?.classList.remove('hovering-badge')
                          }}
                          className="relative z-10"
                        >
                          <Badge
                            variant={hasActiveInOverflow ? 'success' : 'default'}
                            className="transition-all duration-150 hover:bg-brand-200/50 dark:hover:bg-brand-300/80"
                          >
                            + {filteredStack.length - 5}
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
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleStackClick(tech)
                                }}
                                type="button"
                              >
                                <Badge
                                  variant={isActive ? 'success' : 'default'}
                                  className="transition-all duration-150 hover:bg-brand-200/50 hover:border-brand-300/50"
                                >
                                  {tech}
                                </Badge>
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
      </TableCell>

      {/* Replies */}
      <TableCell className="text-right w-[100px]">
        <div className="flex flex-row items-center justify-end gap-2">
          {thread.message_count !== null && thread.message_count !== undefined && (
            <MessageSquareReply
              size={18}
              strokeWidth={1.75}
              className="text-foreground-muted mt-0.5"
            />
          )}
          <p className="text-sm text-foreground-lighter whitespace-nowrap">
            {thread.message_count !== null && thread.message_count !== undefined
              ? Math.max(0, thread.message_count - 1)
              : '—'}
          </p>
        </div>
        {/* Floating link */}
        <Link
          href={`/contribute/t/${thread.id}`}
          className="absolute inset-0 z-0"
          aria-label={`View thread: ${thread.title}`}
          tabIndex={1}
        />
      </TableCell>
    </TableRow>
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
      <mark key={index} className="bg-brand-200 dark:bg-brand-500 dark:!text-foreground px-0.5">
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
