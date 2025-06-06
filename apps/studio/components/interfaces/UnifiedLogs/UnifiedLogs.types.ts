import { type inferParserType } from 'nuqs'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'

export type UnifiedLogsMeta = {
  logTypeCounts: Record<string, number>
  currentPercentiles: Record<string, number>
}

export type SearchParamsType = inferParserType<typeof SEARCH_PARAMS_PARSER>
