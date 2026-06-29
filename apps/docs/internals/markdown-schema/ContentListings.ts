import { withDocsBasePath } from '~/internals/internal-links'
import type { ContentListingGroup } from '~/lib/content-listings.schema'
import { getContentListingById, isExternalContentListingHref } from '~/lib/content-listings.utils'

import { getInternalLinkBaseUrl } from '../internal-links'

const HEADING_MARKDOWN: Record<'h2' | 'h3' | 'h4', string> = {
  h2: '##',
  h3: '###',
  h4: '####',
}

export function serializeContentListingGroupToMarkdown(
  group: ContentListingGroup,
  linkBaseUrl: string
): string {
  const lines: string[] = []
  if (group.heading) {
    const level = group.headingLevel ?? 'h2'
    lines.push(`${HEADING_MARKDOWN[level]} ${group.heading}`)
    lines.push('')
  }

  if (group.description) {
    lines.push(group.description)
    lines.push('')
  }

  for (const item of group.items) {
    const href = isExternalContentListingHref(item.href)
      ? item.href
      : `${linkBaseUrl}${withDocsBasePath(item.href)}`
    lines.push(`- **[${item.title}](${href}):** ${item.description}`)
  }

  return lines.join('\n')
}

/**
 * Markdown export handler for `<ContentListings id="..." />`. Looks up the
 * group by id in the same data registry the React component uses.
 */
export const ContentListings = ({ props }: { props: Record<string, unknown> }): string => {
  const id = typeof props.id === 'string' ? props.id : ''
  if (!id) return ''

  const group = getContentListingById(id)
  if (!group) return ''

  return serializeContentListingGroupToMarkdown(group, getInternalLinkBaseUrl())
}
