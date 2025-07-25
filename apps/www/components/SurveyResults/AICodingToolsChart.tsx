import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateAICodingToolsSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
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
      filterColumns={['headquarters', 'industry_normalized', 'currently_monetizing']}
      generateSQLQuery={generateAICodingToolsSQL}
    />
  )
}
