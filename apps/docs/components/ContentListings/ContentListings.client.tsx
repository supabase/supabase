'use client'

import { getContentListingById } from '~/data/content-listings'
import {
  getContentListingGridItemClassName,
  getContentListingGroupLabel,
  isExternalContentListingHref,
  normalizeContentListingHref,
  type ContentListingGroup,
  type ContentListingItem,
} from '~/lib/content-listings.schema'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { Heading } from 'ui/src/components/CustomHTMLElements'

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

  return (
    <section className="not-prose space-y-4">
      <ContentListingGroupHeading group={group} />
      {group.description && <p className="text-foreground-light">{group.description}</p>}
      <ul className="list-disc pl-6 space-y-2">
        {group.items.map((item) => {
          const href = normalizeContentListingHref(item.href)
          const external = isExternalContentListingHref(href)
          return (
            <li key={`${group.id}-${item.href}`}>
              <Link href={href} onClick={trackClick(item)} target={external ? '_blank' : undefined}>
                <strong>{item.title}</strong>: {item.description}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ContentListingsGridGroup({ group }: { group: ContentListingGroup }) {
  const itemClassName = getContentListingGridItemClassName(group.columns ?? 3)
  const trackClick = useContentListingClickHandler(group)

  return (
    <section className="not-prose space-y-4">
      <ContentListingGroupHeading group={group} />
      {group.description && <p className="text-foreground-light">{group.description}</p>}
      <div className="grid md:grid-cols-12 gap-4">
        {group.items.map((item) => {
          const href = normalizeContentListingHref(item.href)
          const external = isExternalContentListingHref(href)
          return (
            <Link
              key={`${group.id}-${item.href}`}
              href={href}
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
    </section>
  )
}

/**
 * Renders a standardized orientation link section (grid or list layout).
 * The `id` selects which content listing group to render from the data registry.
 */
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
