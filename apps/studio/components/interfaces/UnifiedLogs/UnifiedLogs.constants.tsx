import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
} from 'nuqs'

import { ChartConfig } from 'ui'
import { TooltipLabel } from './TooltipLabel'

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

export const ARRAY_DELIMITER = ','
const SLIDER_DELIMITER = '-'
const SPACE_DELIMITER = '_'
export const RANGE_DELIMITER = '-'
export const SORT_DELIMITER = '.'

const LEVELS = ['success', 'warning', 'error'] as const
const REGIONS = ['ams', 'fra', 'gru', 'hkg', 'iad', 'syd'] as const
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const

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
