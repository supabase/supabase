import type { ChangelogLabel, ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { changelogLabelDisplayName, changelogTagFilterUrl } from '~/lib/changelog.utils'
import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import { Badge, cn } from 'ui'

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

export function LabelBadges({
  labels,
  onBadgeClick,
  tiny,
  className,
}: {
  labels: ChangelogLabel[]
  onBadgeClick?: (e: MouseEvent) => void
  tiny?: boolean
  className?: string
}) {
  if (labels.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center', tiny ? 'gap-0.5' : 'gap-1', className)}>
      {labels.map((label) => (
        <a
          key={label.name}
          href={changelogTagFilterUrl(label.name)}
          className={
            tiny
              ? 'inline-flex shrink-0 no-underline focus-visible:ring-brand-default rounded focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none'
              : 'inline-flex shrink-0 no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          }
          onClick={onBadgeClick}
        >
          <Badge
            variant="default"
            className={cn(
              'tracking-normal lowercase border-default',
              tiny
                ? 'text-foreground-lighter hover:text-foreground-light rounded-full border px-0.5 py-px text-[8px] font-medium leading-none'
                : 'text-foreground-light hover:text-foreground rounded-full border px-1.5 py-px text-[11px] font-medium leading-tight'
            )}
          >
            {changelogLabelDisplayName(label.name)}
          </Badge>
        </a>
      ))}
    </div>
  )
}

function TimelineRow({ item, href }: { item: ChangelogTimelineIndexItem; href: string }) {
  const dateLabel = dayjs(item.sortDate).format('MMM D')
  const labels = item.labels ?? []

  return (
    <div
      className="group border-default flex w-full flex-col gap-0.5 border-b py-3 text-left scroll-mt-16"
      id={item.number.toString()}
    >
      <div className="min-w-0">
        <Link href={href} prefetch={false} className="min-w-0 text-left">
          <h3 className="text-foreground text-lg leading-snug hover:underline">{item.title}</h3>
        </Link>
      </div>
      <div className="flex min-w-0 gap-2 pt-0.5">
        <time dateTime={item.sortDate} className="text-foreground-lighter text-xs tracking-normal">
          {dateLabel}
        </time>
        <LabelBadges labels={labels} onBadgeClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  )
}

type Props = {
  items: ChangelogTimelineIndexItem[]
  omitOuterTimelineBorder?: boolean
}

export function ChangelogTimelineList(props: Props) {
  const { items, omitOuterTimelineBorder } = props
  const yearGroups = groupChangelogIndexByYear(items)

  return (
    <div
      className={
        omitOuterTimelineBorder ? 'relative' : 'border-muted relative lg:border-l lg:ml-2 lg:pl-8'
      }
    >
      {yearGroups.map(([year, yearItems], yearIndex) => (
        <section
          key={year}
          id={year.toString()}
          aria-labelledby={`${year}`}
          className="relative scroll-mt-20"
        >
          <Link
            href={`#${year}`}
            prefetch={false}
            id={`${year}`}
            className="lg:hidden block border-default bg-default text-foreground-light sticky top-[65px] scroll-mt-10 z-20 border-b py-2 pl-0 font-mono text-sm tracking-wide"
          >
            {year}
          </Link>

          <div
            className={
              yearIndex === yearGroups.length - 1
                ? 'grid lg:grid-cols-12 lg:gap-4 pt-2 lg:pt-2'
                : 'grid lg:grid-cols-12 lg:gap-4 pb-8 lg:pb-20 lg:py-2'
            }
          >
            <div className="relative hidden lg:col-span-2 lg:block">
              <div className="-ml-[42px] text-foreground lg:sticky lg:top-[calc(65px+1rem)] lg:pt-4">
                <div className="text-foreground-light mb-1 flex items-center gap-2">
                  <div className="bg-border border-muted flex h-5 w-5 shrink-0 items-center justify-center rounded border drop-shadow-sm">
                    <GitCommit size={14} strokeWidth={1.5} />
                  </div>
                  <Link
                    href={`#${year}`}
                    prefetch={false}
                    className="font-mono text-base leading-none"
                  >
                    {year}
                  </Link>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-10 [&>*:last-child]:border-b-0">
              {yearItems.map((item) => (
                <TimelineRow key={item.number} item={item} href={`/changelog/${item.slug}`} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
