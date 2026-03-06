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

  const prompt = `Explain this PostgreSQL EXPLAIN ANALYZE output in simple terms:

\`\`\`sql
${sql}
\`\`\`

\`\`\`
${explainPlan}
\`\`\`

Format your response with:

**What it does** - 1-2 sentences.

**How it runs** - Briefly explain the plan from bottom to top in plain English. Mention key operations (scans, joins, sorts) and why PostgreSQL chose them.

**Issues** - Identify bottlenecks: slowest steps, sequential scans on large tables, inefficient joins, missing indexes. Be specific with timings from the plan.

**Fixes** - 2-3 specific suggestions with CREATE INDEX statements if applicable.

Keep it concise. Focus on actionable insights.`

  return {
    query: sql,
    prompt,
  }
}
