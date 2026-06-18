'use client'

import {
  normalizeContentListingHref,
  resolveContentListingGroup,
  type ContentListingGroup,
  type ContentListingItem,
} from '~/lib/content-listings.schema'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { useEffect, type ReactNode } from 'react'
import { GlassPanel } from 'ui-patterns/GlassPanel'

import { buildDocsContentListingClickedEvent } from './content-listings.telemetry'
import { useOptionalContentListingsContext } from './ContentListingsContext'

function ContentListingLink({
  item,
  groupTitle,
  listingId,
  children,
  className,
}: {
  item: ContentListingItem
  groupTitle: string
  listingId?: string
  children: ReactNode
  className?: string
}) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const href = normalizeContentListingHref(item.href)

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        sendTelemetryEvent(buildDocsContentListingClickedEvent({ item, groupTitle, listingId }))
      }}
    >
      {children}
    </Link>
  )
}

function ContentListingsListGroup({ group }: { group: ContentListingGroup }) {
  return (
    <section className="not-prose">
      <h2 className="text-xl font-medium scroll-mt-24">{group.title}</h2>
      {group.description && <p className="text-foreground-light">{group.description}</p>}
      <ul className="list-disc pl-6 space-y-2">
        {group.items.map((item) => (
          <li key={`${group.title}-${item.href}`}>
            <ContentListingLink item={item} groupTitle={group.title} listingId={group.id}>
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
  return (
    <section className="not-prose">
      <h2 className="text-xl font-medium scroll-mt-24">{group.title}</h2>
      {group.description && <p className="text-foreground-light">{group.description}</p>}
      <div className="grid md:grid-cols-12 gap-4">
        {group.items.map((item) => (
          <div key={`${group.title}-${item.href}`} className="col-span-12 md:col-span-6">
            <ContentListingLink
              item={item}
              groupTitle={group.title}
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
          <ContentListingsGridGroup key={group.id ?? group.title} group={group} />
        ) : (
          <ContentListingsListGroup key={group.id ?? group.title} group={group} />
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

  return <ContentListingsGroups groups={resolvedGroups} className="space-y-10" />
}

export function ContentListingsFooter() {
  const context = useOptionalContentListingsContext()
  if (!context?.groups.length) return null

  const footerGroups = context.groups.filter((group) => !group.id)

  if (!footerGroups.length) return null

  return <ContentListingsGroups groups={footerGroups} className="mt-12 space-y-10 border-t pt-10" />
}
