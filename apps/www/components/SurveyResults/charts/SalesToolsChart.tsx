import { SurveyChart } from '../SurveyChart'

function generateSalesToolsSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
  SELECT 
  unnest(sales_tools) AS tool_name,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY tool_name
ORDER BY total DESC;
`
}

export function SalesToolsChart() {
  return (
    <SurveyChart
      title="What tools are you using to manage your sales process?"
      targetColumn="sales_tools"
      filterColumns={['person_age', 'headquarters', 'team_count']}
      generateSQLQuery={generateSalesToolsSQL}
    />
  )
}
