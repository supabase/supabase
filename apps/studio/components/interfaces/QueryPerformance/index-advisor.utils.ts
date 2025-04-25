import { toast } from 'sonner'
import { executeSql } from 'data/sql/execute-sql-query'
import { databaseKeys } from 'data/database/keys'

/**
 * Returns the query keys that need to be invalidated after index operations
 */
export const INDEX_ADVISOR_QUERY_KEYS = {
  indexAdvisor: (projectRef?: string) => databaseKeys.indexAdvisorFromQuery(projectRef, ''),
  queryPerformance: ['query-performance'],
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

/**
 * Generates the improvement description text with consistent styling
 *
 * @param indexCount Number of indexes being created
 * @param improvementPercentage The calculated improvement percentage
 * @returns JSX for the improvement description
 */
export function getImprovementText(indexCount: number, improvementPercentage: number): string {
  return `Creating the following ${indexCount > 1 ? 'indexes' : 'index'} can improve this query's performance by ${improvementPercentage.toFixed(2)}%:`
}

interface CreateIndexParams {
  projectRef?: string
  connectionString?: string
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
export function hasIndexRecommendations(result: any, isSuccess: boolean): boolean {
  return isSuccess && result?.index_statements && result.index_statements.length > 0
}
