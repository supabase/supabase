import { withDocsBasePath } from '~/internals/internal-links'

import { isExternalContentListingHref, type ContentListings } from './content-listings.schema'

/**
 * Serialize contentListings front matter to markdown for .md exports and machine consumers.
 */
export function serializeContentListingsToMarkdown(
  contentListings: ContentListings,
  linkBaseUrl: string
): string {
  const sections = contentListings.map((group) => {
    const lines: string[] = []

    if (group.heading) {
      lines.push(`${group.headingLevel ?? '##'} ${group.heading}`)
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
  })

  return sections.join('\n\n')
}
