import { CONTENT_LISTINGS } from '~/data/content-listings'
import { isFeatureEnabled, type Feature } from 'common/enabled-features'

import type { ContentListingGroup, ContentListingItem } from './content-listings.schema'

/** Label for telemetry — prefers heading, falls back to id. */
export function getContentListingGroupLabel(group: ContentListingGroup): string {
  return group.heading ?? group.id
}

export function isExternalContentListingHref(href: string): boolean {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

export function getContentListingById(id: string): ContentListingGroup | undefined {
  return CONTENT_LISTINGS[id]
}

/** Omits items whose `feature` flag is disabled. Shared by UI and markdown export. */
export function filterContentListingItems(items: ContentListingItem[]): ContentListingItem[] {
  return items.filter((item) => !item.feature || isFeatureEnabled(item.feature as Feature))
}
