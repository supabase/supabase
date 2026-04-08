import { EvalScorer } from 'braintrust'
import { parse } from 'libpg-query'

import { AssistantEvalInput, AssistantEvalOutput, Expected } from './scorer'
import { extractIdentifiers, isQuotedInSql, needsQuoting } from '@/lib/sql-identifier-quoting'

export const sqlSyntaxScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ output }) => {
  if (output.sqlQueries === undefined || output.sqlQueries.length === 0) {
    return null
  }

  const errors: string[] = []
  let validQueries = 0

  for (const sql of output.sqlQueries) {
    try {
      await parse(sql)
      validQueries++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(`SQL syntax error: ${errorMessage}`)
    }
  }

  return {
    name: 'SQL Validity',
    score: validQueries / output.sqlQueries.length,
    metadata: errors.length > 0 ? { errors } : undefined,
  }
}

export const sqlIdentifierQuotingScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ output }) => {
  // Skip if no SQL queries
  if (!output.sqlQueries?.length) {
    return null
  }

  const errors: string[] = []
  let totalNeedingQuotes = 0
  let properlyQuoted = 0

  for (const sql of output.sqlQueries) {
    try {
      const ast = await parse(sql)
      const identifiers = extractIdentifiers(ast)

      for (const identifier of identifiers) {
        if (needsQuoting(identifier)) {
          totalNeedingQuotes++
          if (isQuotedInSql(sql, identifier)) {
            properlyQuoted++
          } else {
            const sqlPreview = sql.length > 100 ? `${sql.substring(0, 100)}...` : sql
            errors.push(
              `Identifier "${identifier}" needs quoting but is not quoted in: ${sqlPreview}`
            )
          }
        }
      }
    } catch {
      // Skip invalid SQL - already handled by sqlSyntaxScorer
    }
  }

  const score = totalNeedingQuotes === 0 ? 1 : properlyQuoted / totalNeedingQuotes

  return {
    name: 'SQL Identifier Quoting',
    score,
    metadata: errors.length > 0 ? { errors } : undefined,
  }
}
