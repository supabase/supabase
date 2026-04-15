'use client'

import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { githubChangelogLabelFilterUrl } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import dayjs from 'dayjs'
import { ChevronsUpDown } from 'lucide-react'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXRemote } from 'next-mdx-remote'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
import {
  Badge,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import 'ui-patterns/ShimmeringLoader/index.css'

type FetchedDoc = {
  number: number
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult | null
  error?: string
}

type Props = {
  items: ChangelogTimelineIndexItem[]
}

export function ChangelogV6Explorer({ items }: Props) {
  const [entryParam, setEntryParam] = useQueryState(
    'item',
    parseAsInteger.withOptions({ shallow: true, history: 'push' })
  )
  const [open, setOpen] = useState(false)

  const timelineItems = useMemo(() => {
    return items
      .filter((i) => !i.title.includes('[d]'))
      .sort((a, b) => dayjs(b.sortDate).valueOf() - dayjs(a.sortDate).valueOf())
  }, [items])

  const indexByNumber = useMemo(() => {
    const m = new Map<number, ChangelogTimelineIndexItem>()
    for (const item of timelineItems) {
      m.set(item.number, item)
    }
    return m
  }, [timelineItems])

  const selectedNumber = useMemo(() => {
    if (entryParam != null && indexByNumber.has(entryParam)) return entryParam
    if (timelineItems.length === 0) return null
    return timelineItems[0]?.number ?? null
  }, [entryParam, indexByNumber, timelineItems])

  const selectedItem = useMemo(
    () => (selectedNumber != null ? indexByNumber.get(selectedNumber) : undefined),
    [selectedNumber, indexByNumber]
  )

  /** Items grouped newest→oldest, keyed by year string */
  const itemsByYear = useMemo(() => {
    const groups = new Map<string, ChangelogTimelineIndexItem[]>()
    for (const item of timelineItems) {
      const year = dayjs(item.sortDate).format('YYYY')
      const existing = groups.get(year)
      if (existing) {
        existing.push(item)
      } else {
        groups.set(year, [item])
      }
    }
    return groups
  }, [timelineItems])

  const [doc, setDoc] = useState<FetchedDoc | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)

  useEffect(() => {
    if (selectedNumber == null) {
      setDoc(null)
      setLoadingDoc(false)
      return
    }

    let cancelled = false
    setLoadingDoc(true)
    setDoc(null)

    void (async () => {
      try {
        const res = await fetch(`/api/changelog-discussion/${selectedNumber}`)
        if (cancelled) return
        if (!res.ok) {
          const preview = indexByNumber.get(selectedNumber)
          setDoc({
            number: selectedNumber,
            title: preview?.title ?? '',
            url: preview?.url ?? '',
            created_at: preview?.sortDate ?? '',
            source: null,
            error: res.status === 404 ? 'Not found' : 'Could not load',
          })
          setLoadingDoc(false)
          return
        }
        const data = (await res.json()) as {
          title: string
          url: string
          created_at: string
          source: MDXRemoteSerializeResult
        }
        if (cancelled) return
        setDoc({
          number: selectedNumber,
          title: data.title,
          url: data.url,
          created_at: data.created_at,
          source: data.source,
        })
        setLoadingDoc(false)
      } catch {
        if (cancelled) return
        const preview = indexByNumber.get(selectedNumber)
        setDoc({
          number: selectedNumber,
          title: preview?.title ?? '',
          url: preview?.url ?? '',
          created_at: preview?.sortDate ?? '',
          source: null,
          error: 'Network error',
        })
        setLoadingDoc(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedNumber, indexByNumber])

  const handleSelectEntry = useCallback(
    (n: number) => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      void setEntryParam(n)
      setOpen(false)
    },
    [setEntryParam]
  )

  const labels = selectedItem?.labels ?? []

  const triggerRef = useRef<HTMLButtonElement>(null)

  if (timelineItems.length === 0) {
    return <p className="text-foreground-lighter text-sm">No changelog entries loaded.</p>
  }

  return (
    <>
      <div className="pb-4">
        <h1 className="h1">Changelog</h1>
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <p className="text-foreground-lighter text-lg">New updates and product improvements</p>
          <ChangelogRssButton />
        </div>
      </div>

      {/* Sticky combobox navigator */}
      <div className="sticky top-16 z-30 md:w-[calc(100%+2rem)] md:-mx-4 mb-6 md:px-1 py-2">
        <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
          <PopoverTrigger_Shadcn_ asChild>
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border border-default bg-surface-100/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface-100/95 px-3 py-2.5',
                'text-left transition-colors hover:bg-surface-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-default focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-base font-medium text-foreground leading-snug">
                  {selectedItem?.title ?? 'Select an entry…'}
                </h3>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-xs text-foreground-lighter font-mono whitespace-nowrap">
                    {dayjs(selectedItem?.sortDate).format('MMM D, YYYY')}
                  </span>
                  {selectedItem?.number === timelineItems[0]?.number && <Badge>Latest</Badge>}
                </span>
              </span>
              <ChevronsUpDown
                size={16}
                className="shrink-0 text-foreground-muted"
                strokeWidth={1.5}
              />
            </button>
          </PopoverTrigger_Shadcn_>

          <PopoverContent_Shadcn_
            className="p-0"
            align="start"
            sideOffset={6}
            style={{ width: triggerRef.current?.offsetWidth ?? '100%' }}
          >
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Search changelog…" wrapperClassName="pl-3" />
              <CommandList_Shadcn_ className="max-h-[min(60vh,420px)]">
                <CommandEmpty_Shadcn_>No entries found.</CommandEmpty_Shadcn_>
                {Array.from(itemsByYear.entries()).map(([year, yearItems]) => (
                  <CommandGroup_Shadcn_
                    key={year}
                    heading={year}
                    className={cn(
                      'overflow-visible',
                      '[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10',
                      '[&_[cmdk-group-heading]]:bg-overlay/95 [&_[cmdk-group-heading]]:backdrop-blur-sm',
                      '[&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-border-overlay',
                      '[&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:!px-2',
                      '[&_[cmdk-group-heading]]:text-foreground-light [&_[cmdk-group-heading]]:!font-sans [&_[cmdk-group-heading]]:!normal-case [&_[cmdk-group-heading]]:!tracking-normal'
                    )}
                  >
                    {yearItems.map((item) => {
                      const isActive = item.number === selectedNumber
                      return (
                        <CommandItem_Shadcn_
                          key={item.number}
                          value={`${item.number} ${item.title} ${dayjs(item.sortDate).format('MMM D YYYY')}`}
                          onSelect={() => handleSelectEntry(item.number)}
                          className="flex items-start justify-between gap-3 py-2.5"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="text-xs text-foreground-lighter font-mono whitespace-nowrap">
                              {dayjs(item.sortDate).format('MMM DD')}
                            </span>
                            <span
                              className={cn(
                                'truncate text-sm leading-snug',
                                isActive ? 'text-foreground font-medium' : 'text-foreground-light'
                              )}
                            >
                              {item.title}
                            </span>
                          </span>
                          {/* {item.labels && item.labels.length > 0 && (
                            <span className="flex shrink-0 flex-wrap justify-end gap-1 pt-0.5">
                              {item.labels.slice(0, 3).map((label) => (
                                <Badge
                                  key={label.name}
                                  className="lowercase px-1.5 py-px text-[10px] text-foreground-lighter"
                                >
                                  {label.name}
                                </Badge>
                              ))}
                            </span>
                          )} */}
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </CommandGroup_Shadcn_>
                ))}
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </div>

      {/* Entry content */}
      <section className="min-h-[42vh] mx-auto max-w-xl">
        {loadingDoc && <GenericSkeletonLoader />}

        {!loadingDoc && doc && (
          <div className="flex flex-col gap-6 pb-12">
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {labels.map((label) => (
                  <a
                    key={`${doc.number}-${label.name}`}
                    href={githubChangelogLabelFilterUrl(label.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Badge className="group-hover:text-foreground-light text-foreground-lighter group-hover:border-foreground-muted lowercase px-1.5 py-px text-[11px]">
                      {label.name}
                    </Badge>
                  </a>
                ))}
              </div>
            )}
            {doc.error && <p className="text-destructive-600 pt-1 text-sm">{doc.error}</p>}
            {doc.source ? (
              <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                <MDXRemote {...doc.source} components={mdxComponents('blog')} />
              </article>
            ) : (
              !doc.error && <p className="text-foreground-lighter text-sm">No content.</p>
            )}
          </div>
        )}
      </section>
    </>
  )
}
