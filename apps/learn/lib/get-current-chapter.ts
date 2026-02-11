import { allDocs } from 'contentlayer/generated'
import { normalizeSlug } from './get-next-page'

/**
 * Gets the current chapter number from a doc
 */
export function getCurrentChapter(
  slug: string
): { chapterNumber?: number; completionMessage?: string } | null {
  const normalizedSlug = normalizeSlug(slug)
  const doc = allDocs.find((doc) => normalizeSlug(doc.slugAsParams) === normalizedSlug)

  if (!doc) {
    return null
  }

  // Get chapterNumber from frontmatter first, then fallback to parsing from title
  let chapterNumber: number | undefined = (doc as any)?.chapterNumber
  if (!chapterNumber) {
    // Try to extract chapter number from title (e.g., "2: CSS Styling" -> 2)
    const chapterMatch = doc.title.match(/^(\d+):/)
    chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : undefined
  }

  if (!chapterNumber) {
    return null
  }

  // Use description as completion message, or generate a default one
  const completionMessage = doc.description || undefined

  return {
    chapterNumber,
    completionMessage,
  }
}
