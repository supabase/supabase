import { toast } from 'sonner'

import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { GetIndexAdvisorResultResponse } from 'data/database/retrieve-index-advisor-result-query'
import { executeSql } from 'data/sql/execute-sql-query'

/**
 * Gets the required extensions for index advisor
 * @param extensions Array of database extensions
 * @returns Object containing hypopg, index_advisor, and test_extension extensions if they exist
 */
export function getIndexAdvisorExtensions(extensions: DatabaseExtension[] = []) {
  const hypopg = extensions.find((ext) => ext.name === 'hypopg')
  const indexAdvisor = extensions.find((ext) => ext.name === 'index_advisor')
  return { hypopg, indexAdvisor }
}

/**
 * Calculates the percentage improvement between before and after costs
 *
 * @param costBefore Cost before optimization
 * @param costAfter Cost after optimization
 * @returns Percentage improvement, or 0 if inputs are invalid
 */
export function calculateImprovement(
  costBefore: number | undefined,
  costAfter: number | undefined
): number {
  if (
    costBefore === undefined ||
    costAfter === undefined ||
    costBefore <= 0 ||
    costBefore <= costAfter
  ) {
    return 0
  }

  return ((costBefore - costAfter) / costBefore) * 100
}

interface CreateIndexParams {
  projectRef?: string
  connectionString?: string | null
  indexStatements: string[]
  onSuccess?: () => void
  onError?: (error: any) => void
}

/**
 * Creates database indexes using the provided SQL statements
 *
 * @param params Parameters for index creation
 * @returns Promise that resolves when the index creation completes
 */
export async function createIndexes({
  projectRef,
  connectionString,
  indexStatements,
  onSuccess,
  onError,
}: CreateIndexParams): Promise<void> {
  if (!projectRef) {
    const error = new Error('Project ref is required')
    if (onError) onError(error)
    return Promise.reject(error)
  }

  if (indexStatements.length === 0) {
    const error = new Error('No index statements provided')
    if (onError) onError(error)
    return Promise.reject(error)
  }

  try {
    await executeSql({
      projectRef,
      connectionString,
      sql: indexStatements.join(';\n') + ';',
    })

    toast.success('Successfully created index')
    if (onSuccess) onSuccess()
    return Promise.resolve()
  } catch (error: any) {
    toast.error(`Failed to create index: ${error.message}`)
    if (onError) onError(error)
    return Promise.reject(error)
  }
}

/**
 * Checks if the index advisor result contains recommendations
 *
 * @param result The index advisor result object
 * @param isSuccess Whether the query was successful
 * @returns Whether there are index recommendations available
 */
export function hasIndexRecommendations(
  result: GetIndexAdvisorResultResponse | undefined,
  isSuccess: boolean
): boolean {
  return Boolean(isSuccess && result?.index_statements && result.index_statements.length > 0)
}
