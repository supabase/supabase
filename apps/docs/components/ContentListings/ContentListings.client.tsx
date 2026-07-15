'use client'

import type { ContentListingGroup, ContentListingItem } from '~/lib/content-listings.schema'
import {
  getContentListingById,
  getContentListingGroupLabel,
  isExternalContentListingHref,
} from '~/lib/content-listings.utils'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { useCallback } from 'react'
import { Badge } from 'ui'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { Heading } from 'ui/src/components/CustomHTMLElements'

const GRID_ITEM_CLASS = {
  2: 'col-span-12 md:col-span-6',
  3: 'col-span-12 md:col-span-4',
  4: 'col-span-12 md:col-span-3',
} as const

function useContentListingClickHandler(group: ContentListingGroup) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const groupLabel = getContentListingGroupLabel(group)

  const trackClick = useCallback(
    (item: ContentListingItem) => {
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

function ContentListingGroupHeading({ group }: { group: ContentListingGroup }) {
  if (!group.heading) return null

  return <Heading tag={group.headingLevel ?? 'h2'}>{group.heading}</Heading>
}

function ContentListingsGroup({ group }: { group: ContentListingGroup }) {
  const { trackClick } = useContentListingClickHandler(group)
  const isGrid = group.type === 'grid'
  const listClassName = isGrid ? 'grid md:grid-cols-12 gap-4' : 'list-disc pl-6 space-y-2'
  const gridItemClassName = isGrid ? GRID_ITEM_CLASS[group.columns ?? 3] : undefined

  // Heading stays outside `not-prose` so it inherits the surrounding MDX prose
  // typography. The list itself opts out so its explicit Tailwind layout wins.
  return (
    <section className="space-y-4">
      <ContentListingGroupHeading group={group} />
      <div className="not-prose space-y-4">
        {group.description && <p className="text-foreground-light">{group.description}</p>}
        <ul className={listClassName}>
          {group.items.map((item) => {
            const external = isExternalContentListingHref(item.href)
            const key = `${group.id}-${item.href}`

            if (isGrid) {
              return (
                <li key={key} className={gridItemClassName}>
                  <Link
                    href={item.href}
                    passHref
                    className="block h-full"
                    onClick={() => trackClick(item)}
                    target={external ? '_blank' : undefined}
                  >
                    <GlassPanel
                      title={item.title}
                      icon={item.icon}
                      hasLightIcon={item.hasLightIcon ?? true}
                      badge={item.badge ? <Badge variant="success">{item.badge}</Badge> : undefined}
                    >
                      {item.description}
                    </GlassPanel>
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
                >
                  <strong>{item.title}</strong>: {item.description}
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
  if (!group || !group.items.length) return null

  return (
    <div className="my-10 space-y-10">
      <ContentListingsGroup group={group} />
    </div>
  )
}
