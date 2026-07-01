import { CONTENT_LISTINGS } from '~/data/content-listings'

import type { ContentListingGroup } from './content-listings.schema'

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
