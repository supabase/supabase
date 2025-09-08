import { useMemo } from 'react'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { useProjectLints } from './useProjectLints'

export interface ProjectIssueCounts {
  totalIssues: number
  hasErrors: boolean
  hasWarnings: boolean
}

/**
 * Hook that fetches lint data and calculates issue counts for a project
 */
export const useProjectIssueCounts = (projectRef: string, enabled: boolean): ProjectIssueCounts => {
  const { data: lints } = useProjectLints(projectRef, enabled)

  return useMemo(() => {
    if (!lints) return { totalIssues: 0, hasErrors: false, hasWarnings: false }

    const securityLints = lints.filter((lint) => lint.categories.includes('SECURITY'))
    const performanceLints = lints.filter((lint) => lint.categories.includes('PERFORMANCE'))

    const securityErrorCount = securityLints.filter(
      (lint) => lint.level === LINTER_LEVELS.ERROR
    ).length
    const securityWarningCount = securityLints.filter(
      (lint) => lint.level === LINTER_LEVELS.WARN
    ).length
    const performanceErrorCount = performanceLints.filter(
      (lint) => lint.level === LINTER_LEVELS.ERROR
    ).length
    const performanceWarningCount = performanceLints.filter(
      (lint) => lint.level === LINTER_LEVELS.WARN
    ).length

    const totalIssues =
      securityErrorCount + securityWarningCount + performanceErrorCount + performanceWarningCount
    const hasErrors = securityErrorCount > 0 || performanceErrorCount > 0
    const hasWarnings = securityWarningCount > 0 || performanceWarningCount > 0

    return { totalIssues, hasErrors, hasWarnings }
  }, [lints])
}
