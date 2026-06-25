import { withDocsBasePath } from '~/internals/internal-links'

import { isExternalContentListingHref, type ContentListingGroup } from './content-listings.schema'

/**
 * Serialize a single content listing group to markdown for .md exports and machine consumers.
 */
export function serializeContentListingGroupToMarkdown(
  group: ContentListingGroup,
  linkBaseUrl: string
): string {
  const lines: string[] = []

  if (group.heading) {
    const level = Number((group.headingLevel ?? 'h2').slice(1))
    lines.push(`${'#'.repeat(level)} ${group.heading}`)
  }

  if (group.description) {
    if (lines.length) {
      lines.push('')
    }
    lines.push(group.description)
  }

  if (lines.length) {
    lines.push('')
  }

  for (const item of group.items) {
    const href = isExternalContentListingHref(item.href)
      ? item.href
      : linkBaseUrl
        ? `${linkBaseUrl}${withDocsBasePath(item.href)}`
        : withDocsBasePath(item.href)
    lines.push(`- **[${item.title}](${href}):** ${item.description}`)
  }

  return lines.join('\n')
}

/**
 * @deprecated Use serializeContentListingGroupToMarkdown for single groups via markdown-schema handlers.
 */
export function serializeContentListingsToMarkdown(
  contentListings: ContentListingGroup[],
  linkBaseUrl: string
): string {
  return contentListings
    .map((group) => serializeContentListingGroupToMarkdown(group, linkBaseUrl))
    .join('\n\n')
}
