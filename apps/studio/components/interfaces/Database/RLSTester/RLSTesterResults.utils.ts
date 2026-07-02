import type { ParseQueryResults } from './RLSTester.types'

export function deriveRLSTestState(parseQueryResults: ParseQueryResults | undefined) {
  const isServiceRole = parseQueryResults?.role === undefined
  const tableWithRLSEnabledButNoPolicies = parseQueryResults?.tables.find(
    (x) => x.isRLSEnabled && x.tablePolicies.length === 0
  )
  const tableWithRLSEnabledWithPolicyFalse = parseQueryResults?.tables.find(
    (x) => x.isRLSEnabled && x.tablePolicies.some((y) => y.definition === 'false')
  )
  const noAccessToData =
    !isServiceRole && (!!tableWithRLSEnabledButNoPolicies || !!tableWithRLSEnabledWithPolicyFalse)

  return {
    isServiceRole,
    tableWithRLSEnabledButNoPolicies,
    tableWithRLSEnabledWithPolicyFalse,
    noAccessToData,
  }
}
