'use client'

import {
  getContentListingGridItemClassName,
  getContentListingGroupLabel,
  getContentListingHeadingTag,
  isExternalContentListingHref,
  normalizeContentListingHref,
  resolveContentListingGroup,
  type ContentListingGroup,
  type ContentListingItem,
} from '~/lib/content-listings.schema'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { useEffect, type ReactNode } from 'react'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { Heading } from 'ui/src/components/CustomHTMLElements'

import { buildDocsContentListingClickedEvent } from './content-listings.telemetry'
import { useOptionalContentListingsContext } from './ContentListingsContext'

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
    sendTelemetryEvent(buildDocsContentListingClickedEvent({ item, groupLabel, listingId }))
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

  const tag = getContentListingHeadingTag(group.headingLevel ?? '##')

  return (
    <Heading tag={tag} className="text-xl font-medium scroll-mt-24">
      {group.heading}
    </Heading>
  )
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
              <GlassPanel title={item.title}>{item.description}</GlassPanel>
            </ContentListingLink>
          </div>
        ))}
      </div>
    </section>
  )
}

function ContentListingsGroups({
  groups,
  className,
}: {
  groups: ContentListingGroup[]
  className?: string
}) {
  if (!groups.length) return null

  return (
    <div className={className}>
      {groups.map((group) =>
        group.type === 'grid' ? (
          <ContentListingsGridGroup key={group.id} group={group} />
        ) : (
          <ContentListingsListGroup key={group.id} group={group} />
        )
      )}
    </div>
  )
}

export function ContentListings({
  listing,
  groups: groupsProp,
}: {
  listing?: string
  groups?: ContentListingGroup[]
}) {
  const context = useOptionalContentListingsContext()
  const groups = groupsProp ?? context?.groups ?? []

  useEffect(() => {
    if (listing && context) {
      context.markInlinePlaced(listing)
    }
  }, [context, listing])

  const resolvedGroups = resolveContentListingGroup(groups, listing)

  return <ContentListingsGroups groups={resolvedGroups} className="my-10 space-y-10" />
}

export function ContentListingsFooter() {
  const context = useOptionalContentListingsContext()
  if (!context?.groups.length) return null

  const footerGroups = context.groups.filter((group) => !context.inlinePlacedIds.has(group.id))

  if (!footerGroups.length) return null

  return <ContentListingsGroups groups={footerGroups} className="mt-12 space-y-10 border-t pt-10" />
}
