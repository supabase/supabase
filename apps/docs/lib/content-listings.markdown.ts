import { withDocsBasePath } from '~/internals/internal-links'

import { isExternalContentListingHref, type ContentListingGroup } from './content-listings.schema'

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
