'use client'

import {
  getContentListingById,
  getContentListingGroupLabel,
  isExternalContentListingHref,
} from '~/lib/content-listings.utils'
import type { ContentListingGroup, ContentListingItem } from '~/lib/content-listings.schema'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
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

  return (item: ContentListingItem) => () => {
    sendTelemetryEvent({
      action: 'docs_content_listing_clicked',
      properties: {
        targetPath: item.href,
        linkTitle: item.title,
        ...(groupLabel ? { groupTitle: groupLabel } : {}),
        listingId: group.id,
      },
    })
  }
}

function ContentListingGroupHeading({ group }: { group: ContentListingGroup }) {
  if (!group.heading) return null

  return <Heading tag={group.headingLevel ?? 'h2'}>{group.heading}</Heading>
}

function ContentListingsListGroup({ group }: { group: ContentListingGroup }) {
  const trackClick = useContentListingClickHandler(group)

  // Heading stays outside `not-prose` so it inherits the surrounding MDX prose
  // typography. The list itself opts out so its explicit Tailwind layout wins.
  return (
    <section className="space-y-4">
      <ContentListingGroupHeading group={group} />
      <div className="not-prose space-y-4">
        {group.description && <p className="text-foreground-light">{group.description}</p>}
        <ul className="list-disc pl-6 space-y-2">
          {group.items.map((item) => {
            const external = isExternalContentListingHref(item.href)
            return (
              <li key={`${group.id}-${item.href}`}>
                <Link
                  href={item.href}
                  onClick={trackClick(item)}
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

function ContentListingsGridGroup({ group }: { group: ContentListingGroup }) {
  const itemClassName = GRID_ITEM_CLASS[group.columns ?? 3]
  const trackClick = useContentListingClickHandler(group)

  return (
    <section className="space-y-4">
      <ContentListingGroupHeading group={group} />
      <div className="not-prose space-y-4">
        {group.description && <p className="text-foreground-light">{group.description}</p>}
        <div className="grid md:grid-cols-12 gap-4">
          {group.items.map((item) => {
            const external = isExternalContentListingHref(item.href)
            return (
              <Link
                key={`${group.id}-${item.href}`}
                href={item.href}
                passHref
                className={`${itemClassName} block h-full`}
                onClick={trackClick(item)}
                target={external ? '_blank' : undefined}
              >
                <GlassPanel title={item.title} icon={item.icon} hasLightIcon={Boolean(item.icon)}>
                  {item.description}
                </GlassPanel>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ContentListings({ id }: { id: string }) {
  const group = getContentListingById(id)
  if (!group || !group.items.length) return null

  const content =
    group.type === 'grid' ? (
      <ContentListingsGridGroup group={group} />
    ) : (
      <ContentListingsListGroup group={group} />
    )

  return <div className="my-10 space-y-10">{content}</div>
}
