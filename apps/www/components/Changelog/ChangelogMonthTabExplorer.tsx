'use client'

import 'swiper/css'

import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { githubChangelogLabelFilterUrl } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXRemote } from 'next-mdx-remote'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import type { KeyboardEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mousewheel } from 'swiper/modules'
import { Swiper, SwiperSlide, type SwiperClass } from 'swiper/react'
import { Badge } from 'ui'
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

enum SwiperEdgeState {
  START = 'START',
  MIDDLE = 'MIDDLE',
  END = 'END',
}

export function ChangelogMonthTabExplorer({ items }: Props) {
  const groups = useMemo(() => groupByMonthSorted(items), [items])
  const [monthParam, setMonthParam] = useQueryState(
    'month',
    parseAsString.withOptions({ shallow: true, history: 'push' })
  )
  const groupKeySet = useMemo(() => new Set(groups.map((g) => g.key)), [groups])
  const activeKey = useMemo(() => {
    if (groups.length === 0) return null
    if (monthParam && groupKeySet.has(monthParam)) return monthParam
    return groups[0]!.key
  }, [groupKeySet, groups, monthParam])
  const explorerTopRef = useRef<HTMLDivElement>(null)
  const monthTabElRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)
  const [swiperEdge, setSwiperEdge] = useState<SwiperEdgeState>(SwiperEdgeState.START)
  const [docs, setDocs] = useState<FetchedDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        groups.findIndex((g) => g.key === activeKey)
      ),
    [activeKey, groups]
  )

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

  const updateSwiperEdgeState = useCallback((s: SwiperClass) => {
    if (s.isEnd) setSwiperEdge(SwiperEdgeState.END)
    else if (s.isBeginning) setSwiperEdge(SwiperEdgeState.START)
    else setSwiperEdge(SwiperEdgeState.MIDDLE)
  }, [])

  const handleMonthTabClick = useCallback(
    (key: string) => {
      explorerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      void setMonthParam(key)
    },
    [setMonthParam]
  )

  useEffect(() => {
    if (!swiper || !activeKey) return
    if (swiper.activeIndex === activeIndex) return
    swiper.slideTo(activeIndex, 260, false)
    queueMicrotask(() => updateSwiperEdgeState(swiper))
  }, [activeIndex, activeKey, swiper, updateSwiperEdgeState])

  const handleSwiperSlideChange = useCallback(
    (s: SwiperClass) => {
      updateSwiperEdgeState(s)
      const key = groups[s.activeIndex]?.key
      if (!key || key === activeKey) return
      void setMonthParam(key)
    },
    [activeKey, groups, setMonthParam, updateSwiperEdgeState]
  )

  const handleSwiperTap = useCallback(
    (s: SwiperClass) => {
      const i = s.clickedIndex
      if (i < 0 || i >= groups.length) return
      const group = groups[i]
      if (!group) return
      handleMonthTabClick(group.key)
    },
    [groups, handleMonthTabClick]
  )

  const setMonthTabEl = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) monthTabElRefs.current.set(key, el)
    else monthTabElRefs.current.delete(key)
  }, [])

  const focusMonthTab = useCallback((key: string) => {
    queueMicrotask(() => monthTabElRefs.current.get(key)?.focus())
  }, [])

  const handleMonthTabKeyDown = useCallback(
    (index: number, key: string, e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleMonthTabClick(key)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = groups[index + 1]
        if (!next) return
        void setMonthParam(next.key)
        focusMonthTab(next.key)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = groups[index - 1]
        if (!prev) return
        void setMonthParam(prev.key)
        focusMonthTab(prev.key)
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        const first = groups[0]
        if (!first) return
        void setMonthParam(first.key)
        focusMonthTab(first.key)
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        const last = groups[groups.length - 1]
        if (!last) return
        void setMonthParam(last.key)
        focusMonthTab(last.key)
      }
    },
    [focusMonthTab, groups, handleMonthTabClick, setMonthParam]
  )

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
    <div ref={explorerTopRef} className="flex flex-col scroll-mt-[80px]">
      <div className="w-full border-default sticky flex top-[65px] z-30 py-3">
        <div className="border-default relative flex justify-center overflow-hidden px-2 py-2 rounded-full border bg-surface-100/80 shadow-sm supports-[backdrop-filter]:bg-surface-100/80 backdrop-blur-md lg:mx-[-2rem] lg:!w-[calc(100%+4rem)] [&_.swiper-slide]:!w-auto">
          <Swiper
            modules={[Mousewheel]}
            mousewheel={{
              enabled: true,
              sensitivity: 0.85,
              releaseOnEdges: true,
            }}
            initialSlide={activeIndex}
            spaceBetween={8}
            slidesPerView="auto"
            grabCursor
            watchOverflow
            threshold={2}
            touchRatio={1}
            shortSwipes
            longSwipesRatio={0.22}
            simulateTouch
            preventClicks
            preventClicksPropagation
            updateOnWindowResize
            onSwiper={(instance) => {
              setSwiper(instance)
              updateSwiperEdgeState(instance)
            }}
            onSlideChange={handleSwiperSlideChange}
            onTap={handleSwiperTap}
            className="relative w-full overflow-hidden"
            role="tablist"
            aria-label="Changelog by month"
          >
            {/* <div
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 z-20 w-20 h-full bg-gradient-to-r from-background-surface-100 via-background-surface-100/80 to-transparent opacity-0 transition-opacity supports-[backdrop-filter]:from-background-surface-100/90',
                swiperEdge !== SwiperEdgeState.START && 'opacity-100'
              )}
              aria-hidden
            /> */}
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 right-0 z-20 w-20 h-full bg-gradient-to-l from-background-surface-100 via-background-surface-100/80 to-transparent opacity-0 transition-opacity supports-[backdrop-filter]:from-background-surface-100/90',
                swiperEdge !== SwiperEdgeState.END && 'opacity-100'
              )}
              aria-hidden
            />
            {groups.map(({ key, label }, index) => {
              const selected = key === activeKey
              return (
                <SwiperSlide key={key} className="!w-auto shrink-0">
                  <div
                    ref={(el) => setMonthTabEl(key, el)}
                    role="tab"
                    tabIndex={selected ? 0 : -1}
                    aria-selected={selected}
                    onKeyDown={(e) => handleMonthTabKeyDown(index, key, e)}
                    className={cn(
                      'select-none rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-brand-default focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100',
                      selected ? 'text-foreground' : 'text-foreground-lighter hover:text-foreground'
                    )}
                  >
                    {label}
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>

      <div className="min-h-[40vh] pt-6">
        {loadingDocs && <GenericSkeletonLoader />}

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
                  className="border-muted grid pb-12 last:pb-0 lg:grid-cols-12 lg:gap-8 lg:border-l lg:pb-36"
                >
                  <div className="col-span-12 mb-8 self-start lg:sticky lg:top-4 lg:col-span-4 lg:-mt-32 lg:pt-32">
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
                                className="inline-flex no-underline focus-visible:ring-brand-default rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                              >
                                <Badge className="px-1.5 py-px lowercase text-[11px] leading-tight">
                                  {label.name}
                                </Badge>
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
