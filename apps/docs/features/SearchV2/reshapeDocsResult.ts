import { reshapeDocsSearchV2Row, type DocsSearchV2Result } from 'common/hooks/useDocsSearchV2'
import { getAnchor } from 'ui'

// the anchor must match the id from the docs Heading component. Only h2 to h4 get an id
export const reshapeDocsResult = (row: unknown): DocsSearchV2Result | null => {
  const result = reshapeDocsSearchV2Row(row)
  if (!result?.headingLevel || result.headingLevel < 2 || result.headingLevel > 4) return result

  return { ...result, anchor: getAnchor(result.heading) }
}
