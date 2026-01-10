export interface SearchTerm {
  value: string
  exclude: boolean // true if term has "-" prefix
}

/**
 * Parse a search string into an array of search terms
 * Example: "error timeout -500" → [{value: "error", exclude: false}, {value: "timeout", exclude: false}, {value: "500", exclude: true}]
 */
export function parseSearchString(search: string): SearchTerm[] {
  if (!search || typeof search !== 'string') return []

  // Split by spaces but preserve quoted strings
  const regex = /(?:[^\s"]+|"[^"]*")+/g
  const matches = search.match(regex) || []

  return matches
    .map((term) => {
      // Remove surrounding quotes
      const trimmed = term.replace(/^"(.*)"$/, '$1').trim()
      if (!trimmed) return null

      const exclude = trimmed.startsWith('-')
      const value = exclude ? trimmed.slice(1) : trimmed

      // Don't add empty values
      if (!value) return null

      return { value, exclude }
    })
    .filter((term): term is SearchTerm => term !== null)
}

/**
 * Convert search terms array back to a string
 */
export function serializeSearchTerms(terms: SearchTerm[]): string {
  return terms
    .map((term) => {
      const prefix = term.exclude ? '-' : ''
      // Quote terms that contain spaces
      const value = term.value.includes(' ') ? `"${term.value}"` : term.value
      return `${prefix}${value}`
    })
    .join(' ')
}

/**
 * Add a term to existing search string
 * Avoids duplicates
 */
export function addSearchTerm(
  currentSearch: string,
  term: string,
  exclude: boolean
): string {
  const terms = parseSearchString(currentSearch)

  // Check if this exact term (with same exclude flag) already exists
  const existsAlready = terms.some((t) => t.value === term && t.exclude === exclude)

  if (!existsAlready) {
    terms.push({ value: term, exclude })
  }

  return serializeSearchTerms(terms)
}

/**
 * Escape regex special characters for SQL safety
 * Escapes: . * + ? ^ $ { } ( ) | [ ] \
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Remove a specific term from the search string
 */
export function removeSearchTerm(currentSearch: string, term: string, exclude: boolean): string {
  const terms = parseSearchString(currentSearch)
  const filtered = terms.filter((t) => !(t.value === term && t.exclude === exclude))
  return serializeSearchTerms(filtered)
}
