import {
  createParser,
  // createSearchParamsCache, // Removed for Pages Router compatibility
  createSerializer, // Uncommented for Pages Router compatibility
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
  type inferParserType,
  useQueryStates, // Added for potential hook usage
} from 'nuqs'
// Note: import from 'nuqs/server' comment removed
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
  SORT_DELIMITER,
} from 'components/interfaces/DataTableDemo/lib/delimiters'
import { REGIONS } from 'components/interfaces/DataTableDemo/constants/region'
import { METHODS } from 'components/interfaces/DataTableDemo/constants/method'
import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'

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
  'timing.dns': parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  'timing.connection': parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  'timing.tls': parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  'timing.ttfb': parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  'timing.transfer': parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  status: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  regions: parseAsArrayOf(parseAsStringLiteral(REGIONS), ARRAY_DELIMITER),
  method: parseAsArrayOf(parseAsStringLiteral(METHODS), ARRAY_DELIMITER),
  host: parseAsString,
  pathname: parseAsString,
  date: parseAsArrayOf(parseAsTimestamp, RANGE_DELIMITER),
  // REQUIRED FOR SORTING & PAGINATION
  sort: parseAsSort,
  size: parseAsInteger.withDefault(40),
  start: parseAsInteger.withDefault(0),
  // REQUIRED FOR INFINITE SCROLLING (Live Mode and Load More)
  direction: parseAsStringLiteral(['prev', 'next']).withDefault('next'),
  cursor: parseAsTimestamp.withDefault(new Date()),
  live: parseAsBoolean.withDefault(false),
  // REQUIRED FOR SELECTION
  uuid: parseAsString,
}

// Removed for Pages Router compatibility
// export const searchParamsCache = createSearchParamsCache(searchParamsParser)
export const searchParamsSerializer = createSerializer(searchParamsParser) // Uncommented

export type SearchParamsType = inferParserType<typeof searchParamsParser>

// Optional: Add a hook similar to the default demo if needed elsewhere
// export function useInfiniteSearchParams() {
//   return useQueryStates(searchParamsParser)
// }
