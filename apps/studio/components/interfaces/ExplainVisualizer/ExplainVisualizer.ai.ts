import type { QueryPlanRow } from './ExplainVisualizer.types'

export interface ExplainPromptInput {
  sql: string
  explainPlanRows: QueryPlanRow[]
}

export interface ExplainPromptOutput {
  query: string
  prompt: string
}

export function buildExplainPrompt({
  sql,
  explainPlanRows,
}: ExplainPromptInput): ExplainPromptOutput {
  const explainPlan = explainPlanRows.map((row) => row['QUERY PLAN']).join('\n')

  const prompt = `Analyze this SQL query and its execution plan:

**SQL Query:**
\`\`\`sql
${sql}
\`\`\`

**Execution Plan (EXPLAIN ANALYZE):**
\`\`\`
${explainPlan}
\`\`\`

Provide a concise explanation covering:
1. What the query does (1-2 sentences)
2. Performance assessment based on the execution plan (good/concerning, 2-3 sentences)
3. Actionable optimization suggestions based on any bottlenecks identified (if any, 2-3 sentences)

Keep your response concise and focused on actionable insights.`

  return {
    query: sql,
    prompt,
  }
}
