import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { METHODS } from 'components/interfaces/DataTableDemo/constants/method'
import { VERCEL_EDGE_REGIONS } from 'components/interfaces/DataTableDemo/constants/region'
// Note: import from 'nuqs/server' comment removed
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
  SORT_DELIMITER,
} from 'components/interfaces/DataTableDemo/lib/delimiters'
import {
  createParser,
  // createSearchParamsCache, // Removed for Pages Router compatibility
  // createSerializer, // Removed for Pages Router compatibility
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
  type inferParserType,
  // useQueryStates, // Can be added if a hook is needed
} from 'nuqs' // Changed from nuqs/server

// https://logs.run/i?sort=latency.desc

export const parseAsSort = createParser({
  parse(queryValue) {
    const [id, desc] = queryValue.split(SORT_DELIMITER)
    if (!id && !desc) return null
    return { id, desc: desc === 'desc' }
  },
  serialize(value) {
    return `${value.id}.${value.desc ? 'desc' : 'asc'}`
  },
})

export const searchParamsParser = {
  // CUSTOM FILTERS
  level: parseAsArrayOf(parseAsStringLiteral(LEVELS), ARRAY_DELIMITER),
  latency: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  status: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  region: parseAsArrayOf(parseAsStringLiteral(VERCEL_EDGE_REGIONS), ARRAY_DELIMITER),
  method: parseAsArrayOf(parseAsStringLiteral(METHODS), ARRAY_DELIMITER),
  url: parseAsString,
  timestamp: parseAsArrayOf(parseAsTimestamp, RANGE_DELIMITER),
  // REQUIRED FOR SORTING & PAGINATION
  sort: parseAsSort,
  // REQUIRED FOR INFINITE SCROLLING (Live Mode and Load More)
  direction: parseAsStringLiteral(['prev', 'next']).withDefault('next'),
  cursor: parseAsTimestamp.withDefault(new Date()),
  // live: parseAsBoolean.withDefault(false),
  // REQUIRED FOR SELECTION
  uuid: parseAsString,
}

// Removed for Pages Router compatibility
// export const searchParamsCache = createSearchParamsCache(searchParamsParser)
// export const searchParamsSerializer = createSerializer(searchParamsParser)

export type SearchParamsType = inferParserType<typeof searchParamsParser>
