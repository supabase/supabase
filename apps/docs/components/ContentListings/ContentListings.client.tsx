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
import { type ReactNode } from 'react'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { Heading } from 'ui/src/components/CustomHTMLElements'

function ContentListingLink({
  item,
  groupLabel,
  listingId,
  children,
  className,
}: {
  item: ContentListingItem
  groupLabel: string
  listingId: string
  children: ReactNode
  className?: string
}) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const href = normalizeContentListingHref(item.href)

  const onClick = () => {
    sendTelemetryEvent({
      action: 'docs_content_listing_clicked',
      properties: {
        targetPath: item.href,
        linkTitle: item.title,
        ...(groupLabel ? { groupTitle: groupLabel } : {}),
        listingId,
      },
    })
  }

  if (isExternalContentListingHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

function ContentListingGroupHeading({ group }: { group: ContentListingGroup }) {
  if (!group.heading) return null

  return <Heading tag={group.headingLevel ?? 'h2'}>{group.heading}</Heading>
}

function ContentListingsListGroup({ group }: { group: ContentListingGroup }) {
  const groupLabel = getContentListingGroupLabel(group)

  return (
    <section className="not-prose space-y-4">
      <ContentListingGroupHeading group={group} />
      {group.description && <p className="text-foreground-light">{group.description}</p>}
      <ul className="list-disc pl-6 space-y-2">
        {group.items.map((item) => (
          <li key={`${group.id}-${item.href}`}>
            <ContentListingLink item={item} groupLabel={groupLabel} listingId={group.id}>
              <span>
                <strong>{item.title}</strong>: {item.description}
              </span>
            </ContentListingLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ContentListingsGridGroup({ group }: { group: ContentListingGroup }) {
  const itemClassName = getContentListingGridItemClassName(group.columns ?? 3)
  const groupLabel = getContentListingGroupLabel(group)

  return (
    <section className="not-prose space-y-4">
      <ContentListingGroupHeading group={group} />
      {group.description && <p className="text-foreground-light">{group.description}</p>}
      <div className="grid md:grid-cols-12 gap-4">
        {group.items.map((item) => (
          <div key={`${group.id}-${item.href}`} className={itemClassName}>
            <ContentListingLink
              item={item}
              groupLabel={groupLabel}
              listingId={group.id}
              className="block h-full"
            >
              <GlassPanel title={item.title} icon={item.icon} hasLightIcon={Boolean(item.icon)}>
                {item.description}
              </GlassPanel>
            </ContentListingLink>
          </div>
        ))}
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
