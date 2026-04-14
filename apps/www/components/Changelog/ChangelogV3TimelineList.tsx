import type { ChangelogLabel, ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { githubChangelogLabelFilterUrl, githubLabelHex } from '~/lib/changelog.utils'
import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import Link from 'next/link'
import type { MouseEvent } from 'react'

function groupChangelogIndexByYear(
  items: ChangelogTimelineIndexItem[]
): [number, ChangelogTimelineIndexItem[]][] {
  const map = new Map<number, ChangelogTimelineIndexItem[]>()
  for (const item of items) {
    const y = dayjs(item.sortDate).year()
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(item)
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0])
}

function LabelBadges({
  labels,
  onBadgeClick,
  tiny,
}: {
  labels: ChangelogLabel[]
  onBadgeClick?: (e: MouseEvent) => void
  /** Minimal chip for dense list rows */
  tiny?: boolean
}) {
  if (labels.length === 0) return null
  return (
    <div className={tiny ? 'flex flex-wrap items-center gap-0.5' : 'contents'}>
      {labels.map((label) => (
        <a
          key={label.name}
          href={githubChangelogLabelFilterUrl(label.name)}
          target="_blank"
          rel="noopener noreferrer"
          className={
            tiny
              ? 'inline-flex shrink-0 no-underline focus-visible:ring-brand-default rounded focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none'
              : 'inline-flex shrink-0 no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          }
          onClick={onBadgeClick}
        >
          <span
            className={
              tiny
                ? 'border-default bg-surface-200 text-foreground-lighter rounded-full border px-0.5 py-px text-[8px] font-medium leading-none tracking-normal'
                : 'border-default bg-surface-200 text-foreground-light rounded-full border px-1.5 py-px text-[11px] font-medium leading-tight'
            }
          >
            {label.name}
          </span>
        </a>
      ))}
    </div>
  )
}

function TimelineRow({
  item,
  mode,
  href,
  onSelect,
}: {
  item: ChangelogTimelineIndexItem
  mode: 'link' | 'action'
  href?: string
  onSelect?: (item: ChangelogTimelineIndexItem) => void
}) {
  const dateNoYear = dayjs(item.sortDate).format('MMM D')
  const labels = item.labels ?? []

  const titleBlock =
    mode === 'link' && href ? (
      <Link href={href} prefetch={false} className="min-w-0 text-left">
        <h3 className="text-foreground text-lg leading-snug group-hover:underline">{item.title}</h3>
      </Link>
    ) : (
      <h3 className="text-foreground text-lg leading-snug group-hover:underline">{item.title}</h3>
    )

  const meta = (
    <div className="flex min-w-0 gap-2 pt-0.5">
      <time
        dateTime={item.sortDate}
        className="text-foreground-lighter group-hover:text-foreground-light text-xs tracking-normal"
      >
        {dateNoYear}
      </time>
      <LabelBadges labels={labels} onBadgeClick={(e) => e.stopPropagation()} />
    </div>
  )

  const rowClass = 'group border-default flex w-full flex-col gap-0.5 border-b py-3 text-left'

  if (mode === 'link' && href) {
    return (
      <div className={rowClass}>
        <div className="min-w-0">{titleBlock}</div>
        {meta}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`${rowClass} cursor-pointer bg-transparent`}
    >
      <div className="min-w-0">{titleBlock}</div>
      {meta}
    </button>
  )
}

type Props =
  | {
      items: ChangelogTimelineIndexItem[]
      mode: 'link'
      hrefFor: (item: ChangelogTimelineIndexItem) => string
    }
  | {
      items: ChangelogTimelineIndexItem[]
      mode: 'action'
      onSelect: (item: ChangelogTimelineIndexItem) => void
    }

export function ChangelogV3TimelineList(props: Props) {
  const { items, mode } = props
  const yearGroups = groupChangelogIndexByYear(items)

  return (
    <div className="border-muted relative lg:border-l lg:ml-2 lg:pl-8">
      {yearGroups.map(([year, yearItems], yearIndex) => (
        <section key={year} aria-labelledby={`changelog-year-${year}`} className="relative">
          <h2
            id={`changelog-year-${year}`}
            className="border-default bg-default text-foreground-light sticky top-[65px] z-20 border-b py-2.5 pl-0 font-mono text-sm tracking-wide lg:hidden"
          >
            {year}
          </h2>

          <div
            className={
              yearIndex === yearGroups.length - 1
                ? 'grid lg:grid-cols-12 lg:gap-4 pt-2 lg:pt-2'
                : 'grid lg:grid-cols-12 lg:gap-4 pb-8 lg:pb-20 lg:py-2'
            }
          >
            <div className="relative hidden lg:col-span-2 lg:block">
              <div className="-ml-[42px] text-foreground lg:sticky lg:top-[calc(65px+1rem)] lg:py-3">
                <div className="text-foreground-light mb-1 flex items-center gap-2">
                  <div className="bg-border border-muted flex h-5 w-5 shrink-0 items-center justify-center rounded border drop-shadow-sm">
                    <GitCommit size={14} strokeWidth={1.5} />
                  </div>
                  <p className="font-mono text-base leading-none">{year}</p>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-10 [&>*:last-child]:border-b-0">
              {yearItems.map((item) => (
                <TimelineRow
                  key={item.number}
                  item={item}
                  mode={mode}
                  href={props.mode === 'link' ? props.hrefFor(item) : undefined}
                  onSelect={props.mode === 'action' ? props.onSelect : undefined}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
