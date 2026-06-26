'use client'

import { useMemo } from 'react'

import type { DistributionQuery, SurveyFilters } from '../lib/survey-key'
import { distributionPercent, getDistribution, mergeFilters } from '../lib/survey-keys'
import { useYear } from './year-context'

/** Resolves a query to its percentage for the active year, merging an optional
 *  section-level cohort filter on top of the query filters. Returns null when
 *  the option/column has no data that year. */
export function useDistributionPercent(
  query: DistributionQuery | undefined,
  cohortFilter?: SurveyFilters
): number | null {
  const { year } = useYear()
  return useMemo(() => {
    if (!query) return null
    const filters = mergeFilters(query.filters, cohortFilter)
    return distributionPercent(
      getDistribution(year, query.column, query.aggregation, filters),
      query.target
    )
  }, [year, query?.column, query?.aggregation, query?.target, query?.filters, cohortFilter])
}
