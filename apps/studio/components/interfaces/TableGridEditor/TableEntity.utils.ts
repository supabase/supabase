import { Lint } from '../../../data/lint/lint-query'

export const getEntityLintDetails = (
  entityName: string,
  lintName: string,
  lintLevels: ('ERROR' | 'WARN')[],
  lints: Lint[],
  schema: string
): { hasLint: boolean; count: number } => {
  const matchingLints = lints?.filter(
    (lint) =>
      lint?.metadata?.name === entityName &&
      lint?.metadata?.schema === schema &&
      lint?.name === lintName &&
      lintLevels.includes(lint?.level as 'ERROR' | 'WARN')
  )

  return {
    hasLint: matchingLints.length > 0,
    count: matchingLints.length,
  }
}
