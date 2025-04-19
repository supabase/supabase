import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'

export interface IndexAdvisorConfig {
  projectRef?: string
  connectionString?: string
}

export interface IndexAdvisorResult {
  has_suggestion: boolean
  startup_cost_before: number
  startup_cost_after: number
  total_cost_before: number
  total_cost_after: number
  index_statements: string[]
}

/**
 * Gets the required extensions for index advisor
 * @param extensions Array of database extensions
 * @returns Object containing hypopg and index_advisor extensions if they exist
 */
export function getIndexAdvisorExtensions(extensions: DatabaseExtension[] = []) {
  const hypopg = extensions.find((ext) => ext.name === 'hypopg')
  const indexAdvisor = extensions.find((ext) => ext.name === 'index_advisor')
  return { hypopg, indexAdvisor }
}

/**
 * Checks if a query is eligible for index advisor suggestions
 * @param query SQL query string to check
 * @returns boolean indicating if query is eligible
 */
export function isQueryEligibleForIndexAdvisor(query: string | undefined): boolean {
  if (!query) return false
  return (
    query.toLowerCase().startsWith('select') ||
    query.toLowerCase().startsWith('with pgrst_source') ||
    query.toLowerCase().startsWith('with pgrst_payload')
  )
}

/**
 * Calculates the percentage improvement between two cost values
 * @param costBefore Cost before optimization
 * @param costAfter Cost after optimization
 * @returns Percentage improvement
 */
export function calculateQueryImprovement(costBefore: number, costAfter: number): number {
  return ((costBefore - costAfter) / costBefore) * 100
}

/**
 * Calculates the total query improvement percentage from index advisor results
 * @param indexAdvisorResult Result from index advisor containing before/after costs
 * @returns Total percentage improvement
 */
export function calculateTotalQueryImprovement(indexAdvisorResult: IndexAdvisorResult): number {
  return calculateQueryImprovement(
    indexAdvisorResult.total_cost_before,
    indexAdvisorResult.total_cost_after
  )
}
