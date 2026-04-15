'use client'

import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { githubChangelogLabelFilterUrl } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import dayjs from 'dayjs'
import { Sun } from 'lucide-react'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXRemote } from 'next-mdx-remote'
import Link from 'next/link'
import { parseAsInteger, useQueryState } from 'nuqs'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import 'ui-patterns/ShimmeringLoader/index.css'

/** Total strip height: axis, ticks above, labels below */
const TIMELINE_HEIGHT = 112
const AXIS_Y = 80
const SIDE_PADDING = 32
const MIN_TIMELINE_WIDTH = 1280
/** Pixels per calendar day along the axis (larger = more separation, less overlap) */
const DAY_WIDTH = 16
/** Extra empty calendar days after the newest entry so the latest marker is not flush right */
const TRAILING_EMPTY_DAYS = 18
const TICK_DAY = 10
const TICK_MONTH = 18
const TICK_YEAR = 26
/** Entry marker: dot center Y from top; stem runs from below dot to axis (keep close to axis for short stems) */
const ENTRY_DOT_CENTER_Y = 48
const ENTRY_DOT_DIAMETER_PX = 8
const ENTRY_HIT_PAD_PX = 10

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

export function ChangelogV5Explorer({ items }: Props) {
  const [entryParam, setEntryParam] = useQueryState(
    'entry',
    parseAsInteger.withOptions({ shallow: true, history: 'push' })
  )

  const timelineItems = useMemo(() => {
    return items
      .filter((i) => !i.title.includes('[d]'))
      .sort((a, b) => {
        return dayjs(a.sortDate).valueOf() - dayjs(b.sortDate).valueOf()
      })
  }, [items])

  const indexByNumber = useMemo(() => {
    const m = new Map<number, ChangelogTimelineIndexItem>()
    for (const item of timelineItems) {
      m.set(item.number, item)
    }
    return m
  }, [timelineItems])

  const range = useMemo(() => {
    if (timelineItems.length === 0) return null
    const firstItem = timelineItems[0]
    const lastItem = timelineItems[timelineItems.length - 1]
    if (!firstItem || !lastItem) return null
    const first = dayjs(firstItem.sortDate).startOf('day')
    const last = dayjs(lastItem.sortDate)
      .startOf('day')
      .add(TRAILING_EMPTY_DAYS, 'day')
      .endOf('day')
    return { start: first, end: last }
  }, [timelineItems])

  const rangeStartMs = range?.start.valueOf() ?? 0
  const rangeEndMs = range?.end.valueOf() ?? 1
  const rangeMs = Math.max(1, rangeEndMs - rangeStartMs)

  const dayCount = useMemo(() => {
    if (!range) return 0
    return range.end.startOf('day').diff(range.start.startOf('day'), 'day') + 1
  }, [range])

  const timelineWidth = useMemo(() => {
    if (dayCount <= 0) return MIN_TIMELINE_WIDTH
    return Math.max(MIN_TIMELINE_WIDTH, dayCount * DAY_WIDTH + SIDE_PADDING * 2)
  }, [dayCount])

  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewportScrollW, setViewportScrollW] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setViewportScrollW(el.clientWidth)
    })
    ro.observe(el)
    setViewportScrollW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const canvasWidth = useMemo(() => {
    const vw = viewportScrollW > 0 ? viewportScrollW : 0
    return Math.max(timelineWidth, vw || timelineWidth)
  }, [timelineWidth, viewportScrollW])

  const usableWidth = Math.max(1, canvasWidth - SIDE_PADDING * 2)

  const toX = useCallback(
    (timestampMs: number) => {
      return SIDE_PADDING + clamp((timestampMs - rangeStartMs) / rangeMs, 0, 1) * usableWidth
    },
    [rangeStartMs, rangeMs, usableWidth]
  )

  const dayTicks = useMemo(() => {
    if (!range || dayCount <= 0) return []
    const ticks: { day: dayjs.Dayjs; x: number; kind: 'day' | 'month' | 'year' }[] = []
    for (let i = 0; i < dayCount; i++) {
      const d = range.start.startOf('day').add(i, 'day')
      const isYearStart = d.month() === 0 && d.date() === 1
      const isMonthStart = d.date() === 1
      const kind: 'day' | 'month' | 'year' = isYearStart ? 'year' : isMonthStart ? 'month' : 'day'
      ticks.push({
        day: d,
        x: toX(d.add(12, 'hour').valueOf()),
        kind,
      })
    }
    return ticks
  }, [range, dayCount, toX])

  const entryMarkers = useMemo(() => {
    return timelineItems.map((item) => ({
      item,
      x: toX(dayjs(item.sortDate).valueOf()),
    }))
  }, [timelineItems, toX])

  const todayMarkX = useMemo(() => {
    if (!range) return null
    const today = dayjs().startOf('day')
    if (today.isBefore(range.start, 'day') || today.isAfter(range.end, 'day')) {
      return null
    }
    return toX(today.add(12, 'hour').valueOf())
  }, [range, toX])

  const selectedNumber = useMemo(() => {
    if (entryParam != null && indexByNumber.has(entryParam)) return entryParam
    if (timelineItems.length === 0) return null
    const last = timelineItems[timelineItems.length - 1]
    return last ? last.number : null
  }, [entryParam, indexByNumber, timelineItems])

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

  const dragStartXRef = useRef(0)
  const dragStartScrollLeftRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const selectedItemX = useMemo(() => {
    if (selectedNumber == null) return null
    const item = indexByNumber.get(selectedNumber)
    if (!item) return null
    return toX(dayjs(item.sortDate).valueOf())
  }, [selectedNumber, indexByNumber, toX])

  useEffect(() => {
    if (selectedItemX == null) return
    const el = scrollRef.current
    if (!el) return
    const pad = 48
    const left = el.scrollLeft
    const right = left + el.clientWidth
    if (selectedItemX < left + pad || selectedItemX > right - pad) {
      const maxScroll = Math.max(0, canvasWidth - el.clientWidth)
      el.scrollLeft = clamp(selectedItemX - el.clientWidth / 2, 0, maxScroll)
    }
  }, [selectedItemX, canvasWidth])

  const handleSelectEntry = useCallback(
    (n: number) => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      void setEntryParam(n)
    },
    [setEntryParam]
  )

  const handlePointerDownStrip = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-changelog-v5-entry]')) {
      return
    }
    const viewport = scrollRef.current
    if (!viewport) return
    dragStartXRef.current = event.clientX
    dragStartScrollLeftRef.current = viewport.scrollLeft
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const handlePointerMoveStrip = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      const viewport = scrollRef.current
      if (!viewport) return
      const deltaX = event.clientX - dragStartXRef.current
      viewport.scrollLeft = dragStartScrollLeftRef.current - deltaX
    },
    [isDragging]
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      setIsDragging(false)
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      } catch {
        /* ignore */
      }
    },
    [isDragging]
  )

  const labels = indexByNumber.get(selectedNumber ?? 0)?.labels ?? []

  if (timelineItems.length === 0 || !range) {
    return <p className="text-foreground-lighter text-sm">No changelog entries loaded.</p>
  }

  return (
    <>
      <div className="pb-4 container mx-auto max-w-xl">
        <h1 className="h1">Changelog</h1>
        <p className="text-foreground-lighter text-lg">New updates and product improvements</p>
      </div>

      <section className="relative flex w-full flex-col">
        <div className="container mx-auto max-w-xl min-h-[42vh] w-full">
          {loadingDoc && <GenericSkeletonLoader />}

          {!loadingDoc && doc && (
            <div className="flex flex-col gap-6 pb-12">
              <div
                className={cn(
                  'sticky top-16 z-20 md:-mx-4 md:w-[calc(100%+4rem)] flex flex-col gap-1 border-default border-b md:px-4 py-3',
                  'bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/95'
                )}
              >
                {doc.title && (
                  <Link href={doc.url}>
                    <h3 className="text-foreground text-lg">{doc.title}</h3>
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
              </div>
              {doc.source ? (
                <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                  <MDXRemote {...doc.source} components={mdxComponents('blog')} />
                </article>
              ) : (
                !doc.error && <p className="text-foreground-lighter text-sm">No content.</p>
              )}
            </div>
          )}
        </div>

        <div className="h-32 shrink-0" aria-hidden />

        <div
          className={cn(
            '[background-image:linear-gradient(to_top,hsl(var(--background-default))_0%,hsl(var(--background-default))_75%,hsl(var(--background-default)/0)_100%)]',
            'sticky bottom-0 z-30 w-[100vw] max-w-none shrink-0 py-2',
            '[margin-inline:calc(50%-50vw)]',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          <div
            ref={scrollRef}
            className="w-full min-w-0 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          >
            <TooltipProvider>
              <div
                className="relative min-h-0 select-none"
                style={{
                  width: canvasWidth,
                  minWidth: '100%',
                  height: TIMELINE_HEIGHT,
                }}
                onPointerDown={handlePointerDownStrip}
                onPointerLeave={(e) => {
                  if (isDragging) endDrag(e)
                }}
                onPointerMove={handlePointerMoveStrip}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 z-0 block text-border"
                  focusable="false"
                  role="presentation"
                  height={TIMELINE_HEIGHT}
                  viewBox={`0 0 ${canvasWidth} ${TIMELINE_HEIGHT}`}
                  width={canvasWidth}
                >
                  <line
                    className="stroke-border"
                    strokeWidth={1}
                    x1={0}
                    x2={canvasWidth}
                    y1={AXIS_Y}
                    y2={AXIS_Y}
                  />

                  {dayTicks.map(({ day, x, kind }) => {
                    const h = kind === 'year' ? TICK_YEAR : kind === 'month' ? TICK_MONTH : TICK_DAY
                    return (
                      <line
                        key={day.valueOf()}
                        className="stroke-border-strong"
                        strokeWidth={kind === 'year' ? 1.25 : kind === 'month' ? 1 : 0.75}
                        x1={x}
                        x2={x}
                        y1={AXIS_Y}
                        y2={AXIS_Y - h}
                      />
                    )
                  })}

                  {todayMarkX != null ? (
                    <g aria-hidden>
                      <line
                        className="stroke-foreground-muted/45"
                        strokeDasharray="3 4"
                        strokeWidth={1}
                        x1={todayMarkX}
                        y1={AXIS_Y / 2 + 20}
                        x2={todayMarkX}
                        y2={AXIS_Y}
                      />
                    </g>
                  ) : null}
                </svg>

                {todayMarkX != null ? (
                  <div
                    aria-hidden
                    className="group/today absolute w-10 h-10 z-[5] -translate-x-1/2 flex flex-col items-center text-foreground-muted/70"
                    style={{ left: todayMarkX, top: AXIS_Y / 2 - 12 }}
                  >
                    <span className="opacity-0 group-hover/today:opacity-100 transition-opacity text-center text-xs text-foreground-muted">
                      Today
                    </span>
                    <Sun size={12} strokeWidth={1.8} />
                  </div>
                ) : null}

                {entryMarkers.map(({ item, x }) => {
                  const active = item.number === selectedNumber
                  const stemTop = ENTRY_DOT_CENTER_Y + ENTRY_DOT_DIAMETER_PX / 2
                  const stemHeight = Math.max(0, AXIS_Y - stemTop)
                  const hitW = ENTRY_DOT_DIAMETER_PX + ENTRY_HIT_PAD_PX * 2
                  const dotTriggerTop =
                    ENTRY_DOT_CENTER_Y - ENTRY_DOT_DIAMETER_PX / 2 - ENTRY_HIT_PAD_PX
                  const dotTriggerHeight = ENTRY_DOT_DIAMETER_PX + ENTRY_HIT_PAD_PX * 2
                  return (
                    <Tooltip delayDuration={0} key={item.number}>
                      <div
                        data-changelog-v5-entry
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'absolute z-[1] -translate-x-1/2',
                          'hover:z-[60] focus-within:z-[60]',
                          active && 'z-[40]'
                        )}
                        style={{
                          left: x,
                          top: 0,
                          width: hitW,
                          height: AXIS_Y,
                        }}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'pointer-events-none absolute left-1/2 w-px -translate-x-1/2',
                            active ? 'bg-brand/60' : 'bg-border-strong'
                          )}
                          style={{
                            top: stemTop,
                            height: stemHeight,
                          }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-hidden
                          className="absolute inset-x-0 cursor-pointer border-0 bg-transparent p-0"
                          style={{ top: stemTop, height: stemHeight }}
                          onClick={() => handleSelectEntry(item.number)}
                        />
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={item.title}
                            onClick={() => handleSelectEntry(item.number)}
                            className={cn(
                              'group absolute left-1/2 z-[2] flex -translate-x-1/2 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 outline-none',
                              'focus-visible:ring-brand-default focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                            )}
                            style={{
                              top: dotTriggerTop,
                              width: hitW,
                              height: dotTriggerHeight,
                            }}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                'block shrink-0 rounded-full transition-transform',
                                active
                                  ? 'bg-brand ring-background-surface-100 ring-2'
                                  : 'bg-foreground-muted hover:bg-foreground-light hover:scale-110 group-focus-visible:scale-110'
                              )}
                              style={{
                                width: ENTRY_DOT_DIAMETER_PX,
                                height: ENTRY_DOT_DIAMETER_PX,
                              }}
                            />
                          </button>
                        </TooltipTrigger>
                      </div>
                      <TooltipContent
                        side="top"
                        align="center"
                        sideOffset={2}
                        collisionPadding={4}
                        className="max-w-screen line-clamp-1 text-left text-xs leading-snug px-1.5 py-1"
                      >
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                {dayTicks
                  .filter((t) => t.kind !== 'day')
                  .map(({ day, x, kind }) => (
                    <div
                      key={`lbl-${day.valueOf()}`}
                      className="text-foreground-lighter pointer-events-none absolute z-0 text-center font-mono text-[10px] leading-none"
                      style={{
                        left: x,
                        top: AXIS_Y + 6,
                        transform: 'translateX(-50%)',
                        width: kind === 'year' ? 48 : 40,
                      }}
                    >
                      {kind === 'year' ? day.format('YYYY') : day.format('MMM')}
                    </div>
                  ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </section>
    </>
  )
}
