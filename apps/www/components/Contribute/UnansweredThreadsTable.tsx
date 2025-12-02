'use client'

import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  User,
  ExternalLink,
  MessageCircle,
  Github,
  Search,
  X,
  Filter,
  Check,
} from 'lucide-react'
import {
  Badge,
  Button,
  TabsContent_Shadcn_,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  cn,
} from 'ui'
import { Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import type { Thread } from '~/data/contribute'

function ThreadRow({
  thread,
  searchParams,
}: {
  thread: Thread
  searchParams: URLSearchParams | null
}) {
  const router = useRouter()

  const handleProductAreaClick = (area: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    const currentArea = params.get('product_area')
    if (currentArea === area) {
      // If already active, remove the filter
      params.delete('product_area')
    } else {
      // If inactive, set it as active
      params.set('product_area', area)
    }
    router.push(`/contribute?${params.toString()}`, { scroll: false })
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      {/* <td className="py-4 px-6">
        <span className="text-xs font-mono text-muted-foreground select-all">
          {thread.id}
        </span>
      </td> */}
      <td className="py-4 px-6">
        <div className="flex flex-col gap-1">
          <a
            href={thread.external_activity_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground transition-colors"
          >
            {thread.title}
          </a>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{thread.user}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <Badge className="text-xs" variant="secondary">
          {thread.channel}
        </Badge>
      </td>
      <td className="py-4 px-6">
        <div className="flex flex-wrap gap-2">
          {thread.product_areas.length > 0 ? (
            thread.product_areas.map((area) => {
              const isActive = searchParams?.get('product_area') === area
              return (
                <button key={area} onClick={() => handleProductAreaClick(area)} type="button">
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className={`text-xs cursor-pointer transition-colors ${
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
      <td className="py-4 px-6">
        <span className="text-sm text-muted-foreground">{thread.posted}</span>
      </td>
      <td className="py-4 px-6">
        <Button type="text" icon={<ExternalLink className="h-3.5 w-3.5 ml-1" />} asChild>
          <a href={thread.external_activity_url} target="_blank" rel="noopener noreferrer">
            Reply
          </a>
        </Button>
      </td>
    </tr>
  )
}

function getTabName(tab: string | null): string {
  if (tab === 'reddit') return 'Reddit'
  if (tab === 'github') return 'GitHub'
  return 'Discord'
}

function ThreadsTable({
  threads,
  searchParams,
}: {
  threads: Thread[]
  searchParams: URLSearchParams | null
}) {
  if (threads.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No {getTabName(searchParams?.get('tab') || null)} threads found
      </div>
    )
  }

  return (
    <div className=" overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            {/* <th className="text-left py-3 px-6 text-sm font-semibold text-foreground">
              ID
            </th> */}
            <th className="text-left py-3 px-6 text-sm text-foreground">Thread</th>
            <th className="text-left py-3 px-6 text-sm text-foreground">Channel</th>
            <th className="text-left py-3 px-6 text-sm text-foreground">Product Areas</th>
            <th className="text-left py-3 px-6 text-sm text-foreground">Posted</th>
            <th className="text-left py-3 px-6 text-sm text-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} searchParams={searchParams} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function UnansweredThreadsTable({
  threads,
  allProductAreas,
}: {
  threads: Thread[]
  allProductAreas: string[]
}) {
  const [search, setSearch] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  const validTabs = ['discord', 'reddit', 'github'] as const
  const tabFromUrl = searchParams?.get('tab')
  const currentTab = (
    validTabs.includes(tabFromUrl as any) ? tabFromUrl : 'discord'
  ) as (typeof validTabs)[number]

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'discord') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    router.push(`/contribute?${params.toString()}`, { scroll: false })
  }

  const filteredThreads = useMemo(() => {
    if (!search.trim()) {
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

  const discordThreads = filteredThreads.filter((t) => t.source === 'discord')
  const redditThreads = filteredThreads.filter((t) => t.source === 'reddit')
  const githubThreads = filteredThreads.filter((t) => t.source === 'github')

  const hasActiveFilters = searchParams?.get('product_area') || search.trim()

  const handleProductAreaFilter = (area: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (params.get('product_area') === area) {
      params.delete('product_area')
    } else {
      params.set('product_area', area)
    }
    router.push(`/contribute?${params.toString()}`, { scroll: false })
  }

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
              value="discord"
              className="gap-2 px-4 data-[state=active]:bg-surface-300 border-none"
            >
              <MessageCircle className="h-4 w-4" />
              Discord {discordThreads.length}
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="reddit"
              className="gap-2 px-4 data-[state=active]:bg-surface-300 border-none"
            >
              <MessageCircle className="h-4 w-4" />
              Reddit {redditThreads.length}
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="github"
              className="gap-2 px-4 data-[state=active]:bg- border-none"
            >
              <Github className="h-4 w-4" />
              GitHub Issues {githubThreads.length}
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input_Shadcn_
                type="text"
                placeholder="Search threads by title, author, or summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Button */}
            <Popover_Shadcn_>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  type="default"
                  icon={<Filter className="h-4 w-4" />}
                  className={cn('h-8', searchParams?.get('product_area') ? 'bg-surface-200' : '')}
                >
                  Filters
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="w-64 p-0" align="end">
                <div className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Product Areas</h4>
                  <div className="relative">
                    <div className="grid gap-2 max-h-72 overflow-y-auto">
                      {allProductAreas.length > 0 ? (
                        allProductAreas.map((area) => {
                          const isActive = searchParams?.get('product_area') === area
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => handleProductAreaFilter(area)}
                              className="flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted"
                            >
                              <Check
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  isActive ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {area}
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          No product areas available
                        </p>
                      )}
                    </div>
                    {/* Shadow overlay to indicate scrollable content */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-background to-transparent" />
                  </div>
                  {hasActiveFilters && (
                    <div className="mt-3">
                      <Button
                        type="outline"
                        icon={<X className="h-4 w-4" />}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams?.toString() || '')
                          params.delete('product_area')
                          router.push(`/contribute?${params.toString()}`, { scroll: false })
                          setSearch('')
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </div>
        </div>

        <TabsContent_Shadcn_ value="discord">
          <ThreadsTable threads={discordThreads} searchParams={searchParams} />
        </TabsContent_Shadcn_>

        <TabsContent_Shadcn_ value="reddit">
          <ThreadsTable threads={redditThreads} searchParams={searchParams} />
        </TabsContent_Shadcn_>

        <TabsContent_Shadcn_ value="github">
          <ThreadsTable threads={githubThreads} searchParams={searchParams} />
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </section>
  )
}
