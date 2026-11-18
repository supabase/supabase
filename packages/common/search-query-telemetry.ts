import type { SearchQueryProperties } from './telemetry-constants'

const KEYWORD_PATTERN = /^[a-z]{1,16}(?:[ _-][a-z]{1,16}){0,3}$/i
const MAX_KEYWORD_LENGTH = 40

// People paste credentials and personal data into search boxes, so the text itself is sent
// only for short letters-only terms: keys, tokens, emails, ids and project refs never match.
export function describeSearchQuery(rawQuery: string): SearchQueryProperties {
  const query = rawQuery.trim().replace(/\s+/g, ' ')
  const queryWordCount = query ? query.split(/\s+/).length : 0
  const isKeyword = query.length <= MAX_KEYWORD_LENGTH && KEYWORD_PATTERN.test(query)

  return {
    ...(isKeyword && { query }),
    queryLength: query.length,
    queryWordCount,
  }
}
