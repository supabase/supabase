import type { SearchQueryProperties } from './telemetry-constants'

type SearchQueryType = SearchQueryProperties['queryType']

const KEYWORD_PATTERN = /^[a-z]+(?:[ _-][a-z]+){0,3}$/i
const MAX_KEYWORD_LENGTH = 40
const MIN_CONVERSATIONAL_WORDS = 4

function classifySearchQuery(query: string, wordCount: number): SearchQueryType {
  const isKeyword = query.length <= MAX_KEYWORD_LENGTH && KEYWORD_PATTERN.test(query)
  if (isKeyword) return 'keyword'
  if (wordCount >= MIN_CONVERSATIONAL_WORDS) return 'conversational'
  return 'other'
}

// People paste credentials and personal data into search boxes, so the text itself is sent
// only when it is a short letters-only term, a shape those values cannot take.
export function describeSearchQuery(rawQuery: string): SearchQueryProperties {
  const query = rawQuery.trim()
  const queryWordCount = query ? query.split(/\s+/).length : 0
  const queryType = classifySearchQuery(query, queryWordCount)

  return {
    ...(queryType === 'keyword' && { query }),
    queryLength: query.length,
    queryWordCount,
    queryType,
  }
}
