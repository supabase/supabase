'use client'

import type { ContentListingGroup, ContentListingItem } from '~/lib/content-listings.schema'
import {
  filterContentListingItems,
  getContentListingById,
  getContentListingGroupLabel,
  isExternalContentListingHref,
} from '~/lib/content-listings.utils'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
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

function ContentListingProgression({ group }: { group: ContentListingGroup }) {
  const { trackClick } = useContentListingClickHandler(group)
  const items = filterContentListingItems(group.items).filter(
    (item): item is ContentListingItem & { href: string } => Boolean(item.href)
  )
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleStepDeactivate = () => setActiveIndex(null)

  return (
    <ol
      aria-labelledby={group.labelledBy}
      aria-label={group.labelledBy ? undefined : (group.heading ?? 'Progression')}
      className="m-0 flex list-none flex-col items-center p-0"
    >
      {items.map((item, index) => (
        <ContentListingProgressionStep
          key={`${group.id}-${item.href}`}
          item={item}
          index={index}
          isOnActivePath={activeIndex !== null && index <= activeIndex}
          onItemClick={trackClick}
          onStepActivate={setActiveIndex}
          onStepDeactivate={handleStepDeactivate}
        />
      ))}
    </ol>
  )
}

function ContentListingProgressionStep({
  item,
  index,
  isOnActivePath,
  onItemClick,
  onStepActivate,
  onStepDeactivate,
}: {
  item: ContentListingItem & { href: string }
  index: number
  isOnActivePath: boolean
  onItemClick: (item: ContentListingItem) => void
  onStepActivate: (index: number) => void
  onStepDeactivate: () => void
}) {
  const handleActivate = () => onStepActivate(index)

  return (
    <li className="flex w-full flex-col items-center">
      {index > 0 ? (
        <span
          aria-hidden
          className={cn(
            'mt-3 h-6 border-l border-strong',
            isOnActivePath ? 'border-solid' : 'border-dashed'
          )}
        />
      ) : null}
      <a
        href={item.href}
        className={cn(
          'group focus-ring relative mt-3 flex w-full max-w-md',
          'border-t border-l border-strong px-8 py-7 font-mono text-sm no-underline'
        )}
        onClick={() => onItemClick(item)}
        onPointerEnter={handleActivate}
        onPointerLeave={onStepDeactivate}
        onFocus={handleActivate}
        onBlur={onStepDeactivate}
      >
        <span className="absolute top-0 left-6 max-w-[calc(100%-3rem)] -translate-y-1/2 truncate bg-background px-2 text-foreground-light group-hover:text-foreground group-focus-visible:text-foreground">
          <span className="text-foreground-lighter group-hover:text-foreground-light group-focus-visible:text-foreground-light">
            {index + 1}
          </span>{' '}
          {item.subtitle ?? item.title}
        </span>
        <span className="text-foreground">{item.title}</span>
        <span
          aria-hidden
          className="absolute right-2 bottom-0 left-0 h-px bg-border-strong group-hover:right-4.5 group-focus-visible:right-4.5"
        />
        <span
          aria-hidden
          className="absolute right-0 bottom-0 size-2 border-r border-b border-strong group-hover:border-foreground-light group-focus-visible:border-foreground-light"
        />
        <span
          aria-hidden
          className="absolute top-0 right-0 bottom-2 w-px bg-border-strong group-hover:bottom-4.5 group-focus-visible:bottom-4.5"
        />
        <span
          aria-hidden
          className="absolute right-px bottom-px hidden h-px w-3 origin-right rotate-45 bg-foreground-light group-hover:block group-focus-visible:block"
        />
      </a>
    </li>
  )
}

function ContentListingGroupHeading({
  group,
  headingId,
}: {
  group: ContentListingGroup
  headingId?: string
}) {
  if (!group.heading) return null

  return (
    <Heading tag={group.headingLevel ?? 'h2'} customAnchor={headingId}>
      {group.heading}
    </Heading>
  )
}

function ContentListingsGroup({
  group,
  headingId,
}: {
  group: ContentListingGroup
  headingId?: string
}) {
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
      <ContentListingGroupHeading group={group} headingId={headingId} />
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

export function ContentListings({ id, headingId }: { id: string; headingId?: string }) {
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
      <ContentListingsGroup group={group} headingId={headingId} />
    </div>
  )
}
