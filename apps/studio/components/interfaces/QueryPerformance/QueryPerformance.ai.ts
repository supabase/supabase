import { QueryPerformanceRow } from './QueryPerformance.types'

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
