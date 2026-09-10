import { Trace } from 'braintrust'
import { parse } from 'libpg-query'

import { AssistantEvalScorer } from './scorer'
import { getParsedToolSpans } from './trace-utils'
import { createNotebookInputSchema } from '@/components/ui/AIAssistantPanel/Message.utils'
import { executeSqlInputSchema } from '@/lib/ai/tools/studio-tools'
import { extractIdentifiers, isQuotedInSql, needsQuoting } from '@/lib/sql-identifier-quoting'

/**
 * Extracts SQL strings from `execute_sql` tool spans and from every database cell inside
 * `create_notebook` tool spans. Log cells are excluded — their SQL targets ClickHouse, and
 * libpg-query only understands Postgres syntax.
 */
async function getSqlQueries(trace: Trace): Promise<string[]> {
  const executeSqlSpans = await getParsedToolSpans(trace, 'execute_sql', {
    inputSchema: executeSqlInputSchema,
  })
  const createNotebookSpans = await getParsedToolSpans(trace, 'create_notebook', {
    inputSchema: createNotebookInputSchema,
  })

  const notebookCellSql = createNotebookSpans.flatMap((s) =>
    s.input.content.cells.filter((cell) => cell._tag === 'database_cell').map((cell) => cell.sql)
  )

  return [...executeSqlSpans.map((s) => s.input.sql), ...notebookCellSql]
}

export const sqlSyntaxScorer: AssistantEvalScorer = async ({ trace }) => {
  if (!trace) return null

  const sqlQueries = await getSqlQueries(trace)
  if (sqlQueries.length === 0) return null

  const errors: string[] = []
  let validQueries = 0

  for (const sql of sqlQueries) {
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
    score: validQueries / sqlQueries.length,
    metadata: errors.length > 0 ? { errors } : undefined,
  }
}

export const sqlIdentifierQuotingScorer: AssistantEvalScorer = async ({ trace }) => {
  if (!trace) return null

  const sqlQueries = await getSqlQueries(trace)
  if (sqlQueries.length === 0) return null

  const errors: string[] = []
  let totalNeedingQuotes = 0
  let properlyQuoted = 0

  for (const sql of sqlQueries) {
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
