/**
 * Parameters that should be excluded from standard SQL query condition building
 */

// Pagination and control parameters
export const PAGINATION_PARAMS = [
  'sort',
  'start',
  'size',
  'uuid',
  'cursor',
  'direction',
  'live',
] as const

export type PaginationParamType = (typeof PAGINATION_PARAMS)[number]

// Special filter parameters that need custom handling
export const SPECIAL_FILTER_PARAMS = ['date'] as const

export type SpecialFilterParamType = (typeof SPECIAL_FILTER_PARAMS)[number]

// Combined list of all parameters to exclude from standard filtering
export const EXCLUDED_QUERY_PARAMS = [...PAGINATION_PARAMS, ...SPECIAL_FILTER_PARAMS] as const

export type ExcludedQueryParamType = (typeof EXCLUDED_QUERY_PARAMS)[number]

/**
 * Parameters that need special handling in buildBaseConditions and raw SQL queries
 * This is different from the EXCLUDED_QUERY_PARAMS used in getUnifiedLogsQuery.
 *
 * In raw SQL queries against log type tables, 'level' needs to be processed differently
 * because it maps to different columns/conditions depending on the log type.
 */
export const BASE_CONDITIONS_EXCLUDED_PARAMS = [...PAGINATION_PARAMS, 'date', 'level'] as const
