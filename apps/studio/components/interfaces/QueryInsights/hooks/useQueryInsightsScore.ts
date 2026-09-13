import { useMemo } from 'react'

import {
  HIGH_CALL_THRESHOLD,
  SCORE_DEDUCTIONS,
} from '../QueryInsightsHealth/QueryInsightsHealth.constants'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'
import { getHealthLevel } from '../QueryInsightsHealth/QueryInsightsHealth.utils'

export function useQueryInsightsScore({
  errors,
  indexIssues,
  slowQueries,
}: {
  errors: ClassifiedQuery[]
  indexIssues: ClassifiedQuery[]
  slowQueries: ClassifiedQuery[]
}) {
  return useMemo(() => {
    let score = 100

    score -= errors.length * SCORE_DEDUCTIONS.error

    score -= indexIssues.reduce(
      (acc, q) =>
        acc +
        (q.calls > HIGH_CALL_THRESHOLD
          ? SCORE_DEDUCTIONS.indexHighCalls
          : SCORE_DEDUCTIONS.indexLowCalls),
      0
    )

    score -= slowQueries.reduce(
      (acc, q) =>
        acc +
        (q.calls > HIGH_CALL_THRESHOLD / 2
          ? SCORE_DEDUCTIONS.slowHighCalls
          : SCORE_DEDUCTIONS.slowLowCalls),
      0
    )

    score = Math.max(0, Math.min(100, score))

    return {
      score,
      level: getHealthLevel(score),
    }
  }, [errors, indexIssues, slowQueries])
}
