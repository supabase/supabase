const PAGE_SECTION_LIMIT = 3

interface PageSectionSuggestion {
  headingId: string
  question: string
}

function formatSectionSuggestion(title: string): string {
  const text = title.trim().replace(/\.$/, '')
  const lower = text.toLowerCase()

  if (lower.startsWith('how ')) {
    return `Explain ${lower}.`
  }

  if (lower.startsWith('send ')) {
    return `Explain ${lower}.`
  }

  return `Explain how to ${lower}.`
}

function getPageSectionSuggestions(limit = PAGE_SECTION_LIMIT): PageSectionSuggestion[] {
  if (typeof document === 'undefined') return []

  const headings = Array.from(
    document.querySelector('#sb-docs-guide-main-article')?.querySelectorAll('h2[id]') ?? []
  )

  return headings
    .slice(0, limit)
    .map((heading) => {
      const title = heading.textContent?.replace('#', '').trim() ?? ''
      if (!title || !heading.id) return null

      return {
        headingId: heading.id,
        question: formatSectionSuggestion(title),
      }
    })
    .filter((item): item is PageSectionSuggestion => item !== null)
}

function getPageSectionTitles(limit = PAGE_SECTION_LIMIT): string[] {
  return getPageSectionSuggestions(limit).map((item) => item.question)
}

function getPageSectionQuestions(limit = PAGE_SECTION_LIMIT): string[] {
  return getPageSectionTitles(limit)
}

function getPageSectionSuggestionForHeadingId(
  headingId: string
): PageSectionSuggestion | null {
  if (typeof document === 'undefined') return null

  const heading = document.getElementById(headingId)
  if (!heading || heading.tagName !== 'H2') return null

  const title = heading.textContent?.replace('#', '').trim() ?? ''
  if (!title) return null

  return {
    headingId,
    question: formatSectionSuggestion(title),
  }
}

function scrollToPageSection(headingId: string) {
  const element = document.getElementById(headingId)
  if (!element) return

  element.scrollIntoView({ behavior: 'auto', block: 'start' })
}

function findSectionHeadingIdForElement(element: HTMLElement): string | null {
  const article = document.querySelector('#sb-docs-guide-main-article')
  if (!article || !article.contains(element)) return null

  const headings = Array.from(article.querySelectorAll('h2[id]'))
  let activeHeadingId: string | null = null

  for (const heading of headings) {
    if (heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) {
      activeHeadingId = heading.id
    }
  }

  return activeHeadingId
}

export {
  findSectionHeadingIdForElement,
  formatSectionSuggestion,
  getPageSectionQuestions,
  getPageSectionSuggestionForHeadingId,
  getPageSectionSuggestions,
  getPageSectionTitles,
  PAGE_SECTION_LIMIT,
  scrollToPageSection,
}
export type { PageSectionSuggestion }
