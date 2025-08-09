import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateAICodingToolsSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
SELECT 
  unnest(ai_coding_tools) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function AICodingToolsChart() {
  return (
    <GenericChartWithQuery
      title="Which AI coding tools do you use?"
      targetColumn="ai_coding_tools"
      filterColumns={['person_age', 'team_count', 'funding_stage']}
      generateSQLQuery={generateAICodingToolsSQL}
    />
  )
}
