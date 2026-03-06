import { QueryPerformanceRow } from './QueryPerformance.types'
import type { QueryPlanRow } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import type { ClassifiedQuery } from 'components/interfaces/QueryInsights/QueryInsightsHealth/QueryInsightsHealth.types'
import {
  getTableName,
  getColumnName,
} from 'components/interfaces/QueryInsights/QueryInsightsTable/QueryInsightsTable.utils'

export interface QueryExplanationPrompt {
  query: string
  prompt: string
}

export function buildQueryExplanationPrompt(
  selectedRow: QueryPerformanceRow
): QueryExplanationPrompt {
  const metadata = [
    `Total Time: ${selectedRow.total_time.toLocaleString()}`,
    `Calls: ${selectedRow.calls.toLocaleString()}`,
    `Mean Time: ${selectedRow.mean_time.toLocaleString()}`,
    `Max Time: ${selectedRow.max_time.toLocaleString()}`,
    `Min Time: ${selectedRow.min_time.toLocaleString()}`,
    `Rows Read: ${selectedRow.rows_read.toLocaleString()}`,
    `Cache Hit Rate: ${selectedRow.cache_hit_rate.toLocaleString()}%`,
    `Role: ${selectedRow.rolname}`,
  ].join('\n')

  let additionalContext = ''
  if (selectedRow.index_advisor_result) {
    const indexResult = selectedRow.index_advisor_result

    if (indexResult.index_statements.length > 0) {
      additionalContext = `\n\nIndex Advisor Recommendations:\n${indexResult.index_statements.join('\n')}\n\nCost Analysis:\n- Startup Cost Before: ${indexResult.startup_cost_before}\n- Startup Cost After: ${indexResult.startup_cost_after}\n- Total Cost Before: ${indexResult.total_cost_before}\n- Total Cost After: ${indexResult.total_cost_after}`
    }
  }

  const prompt = `Analyze this database query and provide a brief, concise explanation:

**Performance Metrics:**
${metadata}

${additionalContext}

Provide a short response covering:
1. What the query does (1-2 sentences)
2. Performance assessment (good/concerning and why, keep it brief 2-3 sentences)
3. Actionable optimization suggestions (if any, keep it brief 2-3 sentences)

Keep your response concise and focused on actionable insights. We can continue the conversation if needed to get more details.`

  return {
    query: selectedRow.query,
    prompt,
  }
}

export function buildQueryInsightFixPrompt(item: ClassifiedQuery): QueryExplanationPrompt {
  const stats = [
    `Mean time: ${Math.round(item.mean_time).toLocaleString()}ms`,
    `Total time: ${Math.round(item.total_time).toLocaleString()}ms`,
    `Calls: ${item.calls.toLocaleString()}`,
  ].join('\n')

  const issueContext: Record<NonNullable<ClassifiedQuery['issueType']>, string> = {
    slow: `This query is running slowly (mean ${Math.round(item.mean_time)}ms). The goal is to reduce mean execution time.`,
    index: `This query is missing an index. The planner is doing a sequential scan where an index scan would be faster.`,
    error: `This query has a performance error or anti-pattern: ${item.hint}`,
  }

  const context = item.issueType ? issueContext[item.issueType] : ''

  const tableName = getTableName(item.query)
  const columnName = getColumnName(item.query)
  const queryContext = [tableName && `Table: ${tableName}`, columnName && `Column: ${columnName}`]
    .filter(Boolean)
    .join('\n')

  const prompt = `You are a PostgreSQL performance expert. A query has been flagged in our Query Insights triage view.

**Issue:** ${item.hint}
${context}

**Performance stats:**
${stats}
${queryContext ? `\n**Query context:**\n${queryContext}` : ''}

**Full query:**
\`\`\`sql
${item.query}
\`\`\`

Your task is to provide a concrete fix the user can run directly in their SQL Editor.

Respond with:
1. A short diagnosis (1-2 sentences max) explaining why the query is slow or problematic
2. The exact SQL to fix it — this could be a \`CREATE INDEX\` statement, a rewritten version of the query, or another SQL command
3. A brief explanation of why the fix helps and what improvement to expect

Format the SQL as a runnable code block. Do not add caveats or lengthy explanations — focus on the fix.

**Important:** The SQL Editor runs statements inside a transaction block. Do not use \`CREATE INDEX CONCURRENTLY\` — use plain \`CREATE INDEX\` instead.

**Important:** Use table and column names exactly as they appear in the full query above, including their schema prefix (e.g. \`auth.users\`, not \`public.users\`). Do not guess or change schema names.`

  return { query: item.query, prompt }
}

export function buildExplainOptimizationPrompt(
  query: string,
  planRows: QueryPlanRow[],
  stats?: Pick<QueryPerformanceRow, 'mean_time' | 'calls' | 'total_time'>
): QueryExplanationPrompt {
  const explainText = planRows.map((r) => r['QUERY PLAN']).join('\n')

  const statLines = stats
    ? [
        `Mean time: ${stats.mean_time.toLocaleString()}ms`,
        `Total time: ${stats.total_time.toLocaleString()}ms`,
        `Calls: ${stats.calls.toLocaleString()}`,
      ].join('\n')
    : null

  const prompt = `You are a PostgreSQL performance expert. Analyze the EXPLAIN ANALYZE output below and suggest specific optimizations.

${statLines ? `**Performance stats:**\n${statLines}\n` : ''}
**EXPLAIN ANALYZE output:**
\`\`\`
${explainText}
\`\`\`

Focus on:
1. The most expensive nodes (widest bars / highest actual time)
2. Any Seq Scans on large tables that could be replaced with an Index Scan
3. Large gaps between estimated rows and actual rows (stale statistics)
4. Inefficient join strategies (Nested Loop on large tables)

For each issue found, suggest a concrete fix (e.g. the exact \`CREATE INDEX\` statement, or \`ANALYZE table_name\`). Be concise and actionable.`

  return { query, prompt }
}
