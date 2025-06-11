import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
} from 'nuqs'

import {
  ARRAY_DELIMITER,
  LEVELS,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
  SORT_DELIMITER,
} from 'components/ui/DataTable/DataTable.constants'
import { ChartConfig } from 'ui'
import { TooltipLabel } from './components/TooltipLabel'

export const CHART_CONFIG = {
  success: {
    label: <TooltipLabel level="success" />,
    color: 'hsl(var(--foreground-muted))',
  },
  warning: {
    label: <TooltipLabel level="warning" />,
    color: 'hsl(var(--warning-default))',
  },
  error: {
    label: <TooltipLabel level="error" />,
    color: 'hsl(var(--destructive-default))',
  },
} satisfies ChartConfig

export const REGIONS = ['ams', 'fra', 'gru', 'hkg', 'iad', 'syd'] as const
export const METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const

const parseAsSort = createParser({
  parse(queryValue) {
    const [id, desc] = queryValue.split(SORT_DELIMITER)
    if (!id && !desc) return null
    return { id, desc: desc === 'desc' }
  },
  serialize(value) {
    return `${value.id}.${value.desc ? 'desc' : 'asc'}`
  },
})

export const SEARCH_PARAMS_PARSER = {
  // CUSTOM FILTERS
  level: parseAsArrayOf(parseAsStringLiteral(LEVELS), ARRAY_DELIMITER),
  log_type: parseAsArrayOf(parseAsString, ARRAY_DELIMITER),
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

/** UNUSED */

// export const regions: Record<string, { label: string; flag: string }> = {
//   // REGIONS
//   ams: { label: 'Amsterdam', flag: '🇳🇱' },
//   fra: { label: 'Frankfurt', flag: '🇩🇪' },
//   gru: { label: 'Sao Paulo', flag: '🇧🇷' },
//   hkg: { label: 'Hong Kong', flag: '🇭🇰' },
//   iad: { label: 'Washington D.C.', flag: '🇺🇸' },
//   syd: { label: 'Sydney', flag: '🇦🇺' },
//   // VERCEL EDGE REGIONS
//   hnd1: { label: 'Tokyo', flag: '🇯🇵' },
//   sin1: { label: 'Singapore', flag: '🇸🇬' },
//   cpt1: { label: 'Cape Town', flag: '🇿🇦' },
//   fra1: { label: 'Paris', flag: '🇫🇷' },
//   hkg1: { label: 'Hong Kong', flag: '🇭🇰' },
//   syd1: { label: 'Sydney', flag: '🇦🇺' },
//   gru1: { label: 'Sao Paulo', flag: '🇧🇷' },
//   dub1: { label: 'Dublin', flag: '🇮🇪' },
//   sfo1: { label: 'San Francisco', flag: '🇺🇸' },
//   cdg1: { label: 'Paris', flag: '🇫🇷' },
//   icn1: { label: 'Seoul', flag: '🇰🇷' },
//   kix1: { label: 'Osaka', flag: '🇯🇵' },
//   iad1: { label: 'Washington D.C.', flag: '🇺🇸' },
//   arn1: { label: 'Stockholm', flag: '🇸🇪' },
//   bom1: { label: 'Mumbai', flag: '🇮🇳' },
//   lhr1: { label: 'London', flag: '🇬🇧' },
//   cle1: { label: 'Cleveland', flag: '🇺🇸' },
// }
