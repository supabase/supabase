'use client'

import type { ContentListingGroup, ContentListingItem } from '~/lib/content-listings.schema'
import {
  filterContentListingItems,
  getContentListingById,
  getContentListingGroupLabel,
  isExternalContentListingHref,
} from '~/lib/content-listings.utils'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Badge, cn, Heading } from 'ui'
import { GlassPanel } from 'ui-patterns/GlassPanel'

import { resolveContentListingIcon } from './iconChip'

const GRID_ITEM_CLASS = {
  // Stay 2-up until xl (~1280px) so cards aren't cramped beside the docs sidebar.
  2: 'col-span-12 md:col-span-6',
  3: 'col-span-12 md:col-span-6 xl:col-span-4',
  4: 'col-span-12 md:col-span-6 xl:col-span-3',
} as const

function useContentListingClickHandler(group: ContentListingGroup) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const groupLabel = getContentListingGroupLabel(group)

  const trackClick = useCallback(
    (item: ContentListingItem) => {
      if (!item.href) return

      sendTelemetryEvent({
        action: 'docs_content_listing_clicked',
        properties: {
          targetPath: item.href,
          linkTitle: item.title,
          ...(groupLabel ? { groupTitle: groupLabel } : {}),
          listingId: group.id,
        },
      })
    },
    [sendTelemetryEvent, group.id, groupLabel]
  )

  return { trackClick }
}

const PROGRESSION_COLUMNS = 3

type FlowDirection = 'right' | 'wrap' | 'none'

function progressionDirection(index: number, count: number): FlowDirection {
  if (index >= count - 1) return 'none'
  if (index % PROGRESSION_COLUMNS === PROGRESSION_COLUMNS - 1) return 'wrap'
  return 'right'
}

function FlowArrow({ icon: Icon }: { icon: typeof ChevronDown }) {
  return (
    <span className="relative flex size-4 items-center justify-center rounded-full bg-background text-brand-600">
      <Icon size={14} strokeWidth={2.5} />
    </span>
  )
}

function ProgressionConnector({ direction }: { direction: Exclude<FlowDirection, 'none'> }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <span className="absolute top-full left-1/2 flex h-(--flow-gap) -translate-x-1/2 items-center justify-center @md:hidden">
        <span className="absolute inset-y-0 w-px bg-brand-500/15 dark:bg-brand-500/40" />
        <FlowArrow icon={ChevronDown} />
      </span>
      {direction === 'right' && (
        <span className="absolute top-1/2 left-full hidden h-px w-(--flow-gap) -translate-y-1/2 items-center justify-center @md:flex">
          <span className="absolute inset-x-0 h-px bg-brand-500/15 dark:bg-brand-500/40" />
          <FlowArrow icon={ChevronRight} />
        </span>
      )}
      {direction === 'wrap' && (
        <span className="absolute top-full right-0 hidden h-(--flow-gap) w-[calc(300%+2*var(--flow-gap))] [--elbow:50%] @md:block">
          <span className="absolute top-0 right-[calc(100%/6-var(--flow-gap)/3)] h-(--elbow) w-px bg-brand-500/15 dark:bg-brand-500/40" />
          <span className="absolute top-(--elbow) right-[calc(100%/6-var(--flow-gap)/3)] left-[calc(100%/6-var(--flow-gap)/3)] h-px bg-brand-500/15 dark:bg-brand-500/40" />
          <span className="absolute top-(--elbow) bottom-0 left-[calc(100%/6-var(--flow-gap)/3)] w-px bg-brand-500/15 dark:bg-brand-500/40" />
          <span className="absolute bottom-0 left-[calc(100%/6-var(--flow-gap)/3)] -translate-x-1/2">
            <FlowArrow icon={ChevronDown} />
          </span>
        </span>
      )}
    </span>
  )
}

function ContentListingProgression({ group }: { group: ContentListingGroup }) {
  const { trackClick } = useContentListingClickHandler(group)
  const items = filterContentListingItems(group.items).filter(
    (item): item is ContentListingItem & { href: string } => Boolean(item.href)
  )

  return (
    <div className="@container [--flow-gap:calc(2rem*4/3)]">
      <ol
        aria-label={group.heading ?? 'Progression'}
        className="m-0 grid list-none grid-cols-1 gap-(--flow-gap) p-0 @md:grid-cols-3"
      >
        {items.map((item, index) => {
          const direction = progressionDirection(index, items.length)
          const panel = (
            <GlassPanel title={item.title} icon={resolveContentListingIcon(item.icon)} showIconBg>
              {item.subtitle && (
                <span className="-mt-1 ml-11 block text-xs text-foreground">{item.subtitle}</span>
              )}
            </GlassPanel>
          )

          return (
            <li key={`${group.id}-${item.href}`} className="relative">
              <a
                href={item.href}
                className="block h-full no-underline"
                onClick={() => trackClick(item)}
              >
                {panel}
              </a>
              {direction !== 'none' && <ProgressionConnector direction={direction} />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ContentListingGroupHeading({ group }: { group: ContentListingGroup }) {
  if (!group.heading) return null

  return <Heading tag={group.headingLevel ?? 'h2'}>{group.heading}</Heading>
}

function ContentListingsGroup({ group }: { group: ContentListingGroup }) {
  const { trackClick } = useContentListingClickHandler(group)
  const items = useMemo(() => filterContentListingItems(group.items), [group.items])
  const isGrid = group.type === 'grid'
  const listClassName = isGrid ? 'grid md:grid-cols-12 gap-4' : 'list-disc pl-6 space-y-2'
  const gridItemClassName = isGrid ? GRID_ITEM_CLASS[group.columns ?? 3] : undefined

  if (!items.length) return null

  // Heading stays outside `not-prose` so it inherits the surrounding MDX prose
  // typography. The list itself opts out so its explicit Tailwind layout wins.
  return (
    <section className="space-y-4">
      <ContentListingGroupHeading group={group} />
      <div className="not-prose space-y-4">
        {group.description && (
          <div className="text-foreground-light [&_a]:text-foreground [&_a]:underline [&_p]:m-0">
            <ReactMarkdown>{group.description}</ReactMarkdown>
          </div>
        )}
        <ul className={listClassName}>
          {items.map((item) => {
            const key = `${group.id}-${item.href ?? item.title}`
            const panel = (
              <GlassPanel
                title={item.title}
                icon={resolveContentListingIcon(item.icon)}
                hasLightIcon={item.hasLightIcon ?? typeof item.icon === 'string'}
                className={item.href ? undefined : 'cursor-default'}
                badge={
                  item.badge && item.badgePosition !== 'below' ? (
                    <Badge variant="success">{item.badge}</Badge>
                  ) : undefined
                }
              >
                {item.badge && item.badgePosition === 'below' && (
                  <Badge variant="success" className="mb-3 block w-fit">
                    {item.badge}
                  </Badge>
                )}
                {item.subtitle && (
                  <span className="mb-2 block text-tertiary-foreground">{item.subtitle}</span>
                )}
                {item.description}
              </GlassPanel>
            )
            const listContent = (
              <>
                <strong>{item.title}</strong>: {item.description}
              </>
            )

            if (!item.href) {
              return (
                <li key={key} className={gridItemClassName}>
                  {isGrid ? panel : listContent}
                </li>
              )
            }

            const external = isExternalContentListingHref(item.href)

            if (isGrid) {
              return (
                <li key={key} className={gridItemClassName}>
                  <Link
                    href={item.href}
                    passHref
                    className="block h-full"
                    onClick={() => trackClick(item)}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                  >
                    {panel}
                  </Link>
                </li>
              )
            }

            return (
              <li key={key}>
                <Link
                  href={item.href}
                  onClick={() => trackClick(item)}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                >
                  {listContent}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function ContentListings({ id }: { id: string }) {
  const group = getContentListingById(id)
  if (!group || !filterContentListingItems(group.items).length) return null
  if (group.type === 'progression') {
    return (
      <div className="not-prose my-10">
        <ContentListingProgression group={group} />
      </div>
    )
  }

  return (
    <div className="my-10 space-y-10">
      <ContentListingsGroup group={group} />
    </div>
  )
}
