import { buildWhereClause, SurveyChart } from '../SurveyChart'

function generateMCPAdoptionSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters, ['mcp_adoption IS NOT NULL'])

  return `SELECT
  mcp_adoption AS answer,
  COUNT(*) AS total
FROM responses_2026
${whereClause}
GROUP BY mcp_adoption
ORDER BY total DESC;`
}

export function MCPAdoptionChart() {
  return (
    <SurveyChart
      title="Have you adopted any MCP servers or tools?"
      targetColumn="mcp_adoption"
      filterColumns={['person_age', 'team_size', 'money_raised']}
      functionName="get_mcp_adoption_stats"
      newInYear={2026}
      generateSQLQuery={generateMCPAdoptionSQL}
    />
  )
}
