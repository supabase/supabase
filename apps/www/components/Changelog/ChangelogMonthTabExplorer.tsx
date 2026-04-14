'use client'

import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { githubChangelogLabelFilterUrl, githubLabelHex } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXRemote } from 'next-mdx-remote'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import 'ui-patterns/ShimmeringLoader/index.css'

import { cn } from 'ui'

function groupByMonthSorted(
  items: ChangelogTimelineIndexItem[]
): { key: string; label: string; entries: ChangelogTimelineIndexItem[] }[] {
  const filtered = items.filter((i) => !i.title.includes('[d]'))
  const map = new Map<string, ChangelogTimelineIndexItem[]>()
  for (const item of filtered) {
    const key = dayjs(item.sortDate).format('YYYY-MM')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, entries]) => ({
      key,
      label: dayjs(`${key}-01`).format('MMM YYYY'),
      entries,
    }))
}

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

export function ChangelogMonthTabExplorer({ items }: Props) {
  const groups = useMemo(() => groupByMonthSorted(items), [items])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [docs, setDocs] = useState<FetchedDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    if (activeKey === null && groups.length > 0) {
      setActiveKey(groups[0]!.key)
    }
  }, [activeKey, groups])

  const activeEntries = useMemo(() => {
    if (!activeKey) return []
    return groups.find((g) => g.key === activeKey)?.entries ?? []
  }, [activeKey, groups])

  useEffect(() => {
    if (!activeKey || activeEntries.length === 0) {
      setDocs([])
      setLoadingDocs(false)
      return
    }

    let cancelled = false
    setLoadingDocs(true)
    setDocs([])

    void (async () => {
      const rows: FetchedDoc[] = await Promise.all(
        activeEntries.map(async (item) => {
          try {
            const res = await fetch(`/api/changelog-discussion/${item.number}`)
            if (!res.ok) {
              return {
                number: item.number,
                title: item.title,
                url: item.url,
                created_at: item.sortDate,
                source: null,
                error: res.status === 404 ? 'Not found' : 'Could not load',
              }
            }
            const data = (await res.json()) as {
              title: string
              url: string
              created_at: string
              source: MDXRemoteSerializeResult
            }
            return {
              number: item.number,
              title: data.title,
              url: data.url,
              created_at: data.created_at,
              source: data.source,
            }
          } catch {
            return {
              number: item.number,
              title: item.title,
              url: item.url,
              created_at: item.sortDate,
              source: null,
              error: 'Network error',
            }
          }
        })
      )
      if (cancelled) return
      setDocs(rows)
      setLoadingDocs(false)
    })()

    return () => {
      cancelled = true
      setLoadingDocs(false)
    }
  }, [activeKey, activeEntries])

  const setTabRef = useCallback((key: string, el: HTMLButtonElement | null) => {
    if (el) tabRefs.current.set(key, el)
    else tabRefs.current.delete(key)
  }, [])

  useEffect(() => {
    if (!activeKey) return
    const el = tabRefs.current.get(activeKey)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeKey])

  const indexByNumber = useMemo(() => {
    const m = new Map<number, ChangelogTimelineIndexItem>()
    for (const item of items) {
      m.set(item.number, item)
    }
    return m
  }, [items])

  if (groups.length === 0) {
    return <p className="text-foreground-lighter text-sm">No changelog entries loaded.</p>
  }

  return (
    <div className="flex flex-col">
      <div className="border-default bg-default/90 supports-[backdrop-filter]:bg-default/90 sticky top-[65px] z-30 py-3 backdrop-blur-md">
        <div className="border-default overflow-hidden rounded-full border bg-surface-100 shadow-sm">
          <div
            className="flex flex-nowrap gap-1.5 overflow-x-auto overflow-y-hidden px-2 py-2 sm:gap-2 sm:px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            role="tablist"
            aria-label="Changelog by month"
          >
            {groups.map(({ key, label }) => {
              const selected = key === activeKey
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  ref={(el) => setTabRef(key, el)}
                  onClick={() => setActiveKey(key)}
                  className={cn(
                    'px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                    selected
                      ? 'text-foreground'
                      : 'text-foreground-lighter hover:text-foreground shrink-0'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="min-h-[40vh] pt-6">
        {loadingDocs && (
          <div className="border-muted rounded-lg border p-6">
            <GenericSkeletonLoader />
          </div>
        )}

        {!loadingDocs && activeEntries.length === 0 && (
          <p className="text-foreground-lighter p-6 text-sm">Nothing in this month.</p>
        )}

        {!loadingDocs && activeEntries.length > 0 && (
          <div className="grid">
            {docs.map((doc) => {
              const indexItem = indexByNumber.get(doc.number)
              const labels = indexItem?.labels ?? []

              return (
                <div
                  key={doc.number}
                  className="border-muted grid pb-12 lg:grid-cols-12 lg:gap-8 lg:border-l lg:pb-36"
                >
                  <div className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32">
                    <div className="flex w-full items-baseline border-b pb-4 lg:gap-4 lg:border-none lg:pb-0">
                      <div className="hidden lg:flex bg-border border-muted text-foreground-lighter -ml-2.5 h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                        <GitCommit size={14} strokeWidth={1.5} />
                      </div>
                      <div className="flex w-full flex-col gap-1">
                        {doc.title && (
                          <Link href={doc.url} className="text-foreground text-lg hover:underline">
                            {doc.title}
                          </Link>
                        )}
                        <p className="text-foreground-lighter text-xs font-mono">
                          {dayjs(doc.created_at).format('MMM D, YYYY')}
                        </p>
                        {labels.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {labels.map((label) => (
                              <a
                                key={`${doc.number}-${label.name}`}
                                href={githubChangelogLabelFilterUrl(label.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                              >
                                <span
                                  className="border-default bg-surface-200 text-foreground-light rounded-md border border-l-[3px] px-1.5 py-px text-[11px] font-medium leading-tight"
                                  style={{
                                    borderLeftColor: `#${githubLabelHex(label.color)}`,
                                  }}
                                >
                                  {label.name}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                        {doc.error && (
                          <p className="text-destructive-600 pt-1 text-xs">{doc.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-8 lg:max-w-[calc(100vw-80px)]">
                    {doc.source ? (
                      <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                        <MDXRemote {...doc.source} components={mdxComponents('blog')} />
                      </article>
                    ) : (
                      !doc.error && <p className="text-foreground-lighter text-sm">No content.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
