import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'

export interface IndexAdvisorConfig {
  projectRef?: string
  connectionString?: string
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
