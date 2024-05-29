import { Lint } from '../../../data/lint/lint-query'

export const getEntityLintDetails = (
  entityName: string,
  lintName: string,
  lintLevels: ('ERROR' | 'WARN')[],
  lints: Lint[],
  schema: string
): { hasLint: boolean; count: number; matchingLint: Lint | null } => {
  const matchingLint =
    lints?.find(
      (lint) =>
        lint?.metadata?.name === entityName &&
        lint?.metadata?.schema === schema &&
        lint?.name === lintName &&
        lintLevels.includes(lint?.level as 'ERROR' | 'WARN')
    ) || null

  return {
    hasLint: matchingLint !== null,
    count: matchingLint ? 1 : 0,
    matchingLint,
  }
}
