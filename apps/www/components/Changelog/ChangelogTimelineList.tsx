import type { ChangeType } from '~/lib/changelog-repo'
import {
  CHANGE_TYPE_DISPLAY,
  changelogTagFilterUrl,
  changelogTypeFilterUrl,
  type ChangelogTimelineIndexItem,
} from '~/lib/changelog.utils'
import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import Link from 'next/link'
import { type MouseEvent } from 'react'
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

export function ChangeTypeBadge({
  type,
  onBadgeClick,
  className,
}: {
  type: ChangeType
  onBadgeClick?: (e: MouseEvent) => void
  className?: string
}) {
  const { label, badgeVariant } = CHANGE_TYPE_DISPLAY[type]
  return (
    <a
      href={changelogTypeFilterUrl(type)}
      className="inline-flex shrink-0 no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
      onClick={onBadgeClick}
    >
      <Badge variant={badgeVariant} className={className}>
        {label}
      </Badge>
    </a>
  )
}

export function ProductBadges({
  products,
  onBadgeClick,
  tiny,
  className,
}: {
  products: string[]
  onBadgeClick?: (e: MouseEvent) => void
  tiny?: boolean
  className?: string
}) {
  if (products.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center', tiny ? 'gap-0.5' : 'gap-1', className)}>
      {products.map((product) => (
        <a
          key={product}
          href={changelogTagFilterUrl(product)}
          className={
            tiny
              ? 'inline-flex shrink-0 no-underline focus-ring rounded-sm'
              : 'inline-flex shrink-0 no-underline focus-ring rounded-md'
          }
          onClick={onBadgeClick}
        >
          <Badge
            variant="default"
            className={cn(
              'tracking-normal lowercase border-default',
              tiny
                ? 'text-foreground-lighter hover:text-foreground-light px-0.5 py-px text-[8px] leading-none'
                : 'text-foreground-light hover:text-foreground px-1.5 py-px text-[11px] leading-tight'
            )}
          >
            {product}
          </Badge>
        </a>
      ))}
    </div>
  )
}

function TimelineRow({ item, href }: { item: ChangelogTimelineIndexItem; href: string }) {
  const dateLabel = dayjs(item.sortDate).format('MMM D')

  return (
    <div className="relative group flex w-full gap-3 text-left scroll-mt-16" id={item.slug}>
      <div className="absolute top-[-3px] right-[calc(100%+0.75rem)] hidden shrink-0 lg:block lg:pt-3">
        <ChangeTypeBadge type={item.changeType} onBadgeClick={(e) => e.stopPropagation()} />
      </div>
      <div className="border-default timeline-row-content flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
        <div className="min-w-0">
          <Link href={href} prefetch={false} className="min-w-0 text-left">
            <h3 className="text-foreground text-lg leading-snug hover:underline">{item.title}</h3>
          </Link>
        </div>
        {item.summary && <p className="text-foreground-lighter text-sm">{item.summary}</p>}
        <div className="flex min-w-0 gap-2 pt-0.5">
          <time
            dateTime={item.sortDate}
            className="text-foreground-lighter text-xs font-mono tracking-normal"
          >
            {dateLabel}
          </time>
          <span className="lg:hidden">
            <ChangeTypeBadge type={item.changeType} onBadgeClick={(e) => e.stopPropagation()} />
          </span>
          <ProductBadges
            products={item.affectedProducts}
            onBadgeClick={(e) => e.stopPropagation()}
          />
        </div>
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
                ? 'grid lg:grid-cols-12 lg:gap-8 pt-2 lg:pt-2'
                : 'grid lg:grid-cols-12 lg:gap-8 pb-8 lg:pb-20 lg:py-2'
            }
          >
            <div className="relative hidden lg:col-span-4 lg:block">
              <div className="ml-[-42px] text-foreground lg:sticky lg:top-[calc(65px+1rem)] lg:pt-4">
                <div className="text-foreground-light mb-1 flex items-center gap-2">
                  <div className="bg-border border-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border drop-shadow-xs">
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

            <div className="min-w-0 lg:col-span-8 [&>*:last-child>.timeline-row-content]:border-b-0">
              {yearItems.map((item) => (
                <TimelineRow key={item.slug} item={item} href={`/changelog/${item.slug}`} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
