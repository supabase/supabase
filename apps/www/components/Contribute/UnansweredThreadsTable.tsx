'use client'

import { useState, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import { useRouter } from 'next/navigation'
import { Clock, MessageCircle, Github, Search, Filter, List, BotMessageSquare } from 'lucide-react'
import { Badge, Button, Input_Shadcn_, cn } from 'ui'
import { Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import type { ThreadRow } from '~/types/contribute'
import { ChannelBadge } from './ChannelBadge'
import { FilterPopover } from './FilterPopover'

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
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No threads found
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed">
        <thead className="border-b border-border">
          <tr>
            <th className="text-left py-3 px-6 text-sm text-foreground min-w-[350px] w-[45%]">
              Thread
            </th>
            <th className="text-left py-3 px-6 text-sm text-foreground min-w-[150px] w-[20%]">
              Area
            </th>
            <th className="text-left py-3 px-6 text-sm text-foreground min-w-[150px] w-[20%]">
              Stack
            </th>
            <th className="text-left py-3 px-6 text-sm text-foreground min-w-[100px] w-[15%]">
              Posted
            </th>
          </tr>
        </thead>
        <tbody>
          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} productArea={productArea} search={search} />
          ))}
        </tbody>
      </table>
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

  const [channel, setChannel] = useQueryState(
    'channel',
    parseAsString.withDefault('all').withOptions({
      shallow: false, // notify server, re-render RSC tree
    })
  )
  const [productArea] = useQueryState('product_area', parseAsString)
  const [stack] = useQueryState('stack', parseAsString)

  const validTabs = ['all', 'discord', 'reddit', 'github'] as const
  const currentTab = (
    validTabs.includes(channel as (typeof validTabs)[number]) ? channel : 'all'
  ) as (typeof validTabs)[number]

  async function handleTabChange(value: string) {
    if (value === 'all') {
      await setChannel(null)
    } else {
      await setChannel(value)
    }
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
          <h2 className="text-xl text-foreground">Unresolved Threads</h2>
          <p className="text-foreground-lighter">From the last 24 hours</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Data refreshes every 10 minutes</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs_Shadcn_ value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between gap-4 mb-6">
          <TabsList_Shadcn_ className="gap-6 bg-surface-200 rounded-md">
            <TabsTrigger_Shadcn_
              value="all"
              className="gap-2 px-4 data-[state=active]:bg-surface-300 border-none"
            >
              <List className="h-4 w-4" />
              All
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="discord"
              className="gap-2 px-4 data-[state=active]:bg-surface-300 border-none"
            >
              <BotMessageSquare className="h-4 w-4" />
              Discord
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="reddit"
              className="gap-2 px-4 data-[state=active]:bg-surface-300 border-none"
            >
              <MessageCircle className="h-4 w-4" />
              Reddit
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="github"
              className="gap-2 px-4 data-[state=active]:bg-surface-300 border-none"
            >
              <Github className="h-4 w-4" />
              GitHub
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input_Shadcn_
                type="text"
                placeholder="Search threads by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </form>

            {/* Filter Button */}
            <FilterPopover
              allProductAreas={allProductAreas}
              allStacks={allStacks}
              trigger={
                <Button
                  type="default"
                  icon={<Filter className="h-4 w-4" />}
                  className={cn('h-8', activeFilterCount > 0 ? 'bg-surface-200' : '')}
                >
                  <span className="flex items-center gap-2">
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="bg-brand-200 text-brand-foreground">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </span>
                </Button>
              }
            />
          </div>
        </div>

        <ThreadsTable threads={filteredThreads} productArea={productArea} search={search} />
      </Tabs_Shadcn_>
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
  const [currentProductArea, setProductArea] = useQueryState('product_area', parseAsString)

  function handleProductAreaClick(area: string) {
    if (currentProductArea === area) {
      setProductArea(null)
    } else {
      setProductArea(area)
    }
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-4 px-6 w-[45%] min-w-[350px]">
        <div className="flex flex-col gap-1 overflow-hidden">
          <a
            href={thread.external_activity_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground transition-colors truncate"
          >
            {highlightText(thread.title, search)}
          </a>
          <div className="flex items-center gap-1.5">
            <ChannelBadge channel={thread.channel} />
          </div>
        </div>
      </td>
      <td className="py-4 px-6 w-[20%] min-w-[150px]">
        <div className="flex flex-wrap gap-2 overflow-hidden">
          {thread.product_areas.length > 0 ? (
            thread.product_areas
              .filter((area: string) => area !== 'Other')
              .map((area: string) => {
                const isActive = productArea === area
                return (
                  <button key={area} onClick={() => handleProductAreaClick(area)} type="button">
                    <Badge
                      variant={isActive ? 'default' : 'success'}
                      className={`cursor-pointer transition-colors ${
                        isActive ? 'bg-brand-200 text-brand-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {area}
                    </Badge>
                  </button>
                )
              })
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6 w-[20%] min-w-[150px]">
        <div className="flex flex-wrap gap-2 overflow-hidden">
          {thread.stack.length > 0 ? (
            thread.stack
              .filter((tech: string) => tech !== 'Other')
              .map((tech: string) => (
                <Badge key={tech} variant="default">
                  {tech}
                </Badge>
              ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6 w-[15%] min-w-[100px]">
        <span className="text-sm text-muted-foreground whitespace-nowrap">{thread.posted}</span>
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
