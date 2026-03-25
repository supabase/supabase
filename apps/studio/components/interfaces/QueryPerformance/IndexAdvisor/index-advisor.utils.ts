import { toast } from 'sonner'

import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { GetIndexAdvisorResultResponse } from 'data/database/retrieve-index-advisor-result-query'
import { executeSql } from 'data/sql/execute-sql-query'

import { INTERNAL_SCHEMAS } from 'hooks/useProtectedSchemas'

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
  result: GetIndexAdvisorResultResponse | undefined | null,
  isSuccess: boolean
): boolean {
  return Boolean(isSuccess && result?.index_statements && result.index_statements.length > 0)
}

/**
 * Filters out index statements that reference protected schemas
 * Index statements are typically in the format: "CREATE INDEX ON schema.table USING ..."
 *
 * @param indexStatements Array of index statement strings
 * @returns Filtered array excluding statements referencing protected schemas
 */
export function filterProtectedSchemaIndexStatements(indexStatements: string[]): string[] {
  if (!indexStatements || indexStatements.length === 0) {
    return []
  }

  return indexStatements.filter((statement) => {
    // Match patterns like "CREATE INDEX ON schema.table" or "CREATE INDEX ON "schema"."table""
    // Handle both quoted and unquoted schema names
    const schemaMatch = statement.match(/ON\s+(?:"?(\w+)"?\.|(\w+)\.)/i)

    if (!schemaMatch) {
      // If we can't parse the schema, keep it (safer to show than hide)
      return true
    }

    // Extract schema name (handle both quoted and unquoted)
    const schemaName = schemaMatch[1] || schemaMatch[2]

    if (!schemaName) {
      return true
    }

    // Check if schema is in the protected schemas list
    return !INTERNAL_SCHEMAS.includes(schemaName.toLowerCase())
  })
}

/**
 * Filters an index advisor result to remove recommendations for protected schemas
 *
 * @param result The index advisor result object
 * @returns Filtered result with protected schema recommendations removed
 */
export function filterProtectedSchemaIndexAdvisorResult(
  result: GetIndexAdvisorResultResponse | null | undefined
): GetIndexAdvisorResultResponse | null {
  if (!result || !result.index_statements) {
    return result ?? null
  }

  const filteredStatements = filterProtectedSchemaIndexStatements(result.index_statements)

  // If all statements were filtered out, return null
  if (filteredStatements.length === 0) {
    return null
  }

  return {
    ...result,
    index_statements: filteredStatements,
  }
}

/**
 * Checks if a query involves protected schemas by examining the SQL query text
 *
 * @param query The SQL query string
 * @returns Whether the query involves protected schemas
 */
export function queryInvolvesProtectedSchemas(query: string | undefined | null): boolean {
  if (!query) return false

  const queryLower = query.toLowerCase()

  // Check if the query references any protected schemas
  // Match patterns like "schema.table", "FROM schema.table", "JOIN schema.table", etc.
  return INTERNAL_SCHEMAS.some((schema) => {
    // Match schema.table patterns (with or without quotes)
    const schemaPattern = new RegExp(
      `(?:from|join|update|insert\\s+into|delete\\s+from)\\s+(?:${schema}\\.|"${schema}"\\.)`,
      'i'
    )
    return schemaPattern.test(queryLower)
  })
}
