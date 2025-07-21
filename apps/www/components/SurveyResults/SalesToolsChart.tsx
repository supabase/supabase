import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateSalesToolsSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

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
    <GenericChartWithQuery
      title="TK: If you're using one, which sales tools is your startup using?"
      targetColumn="sales_tools"
      filterColumns={['team_count']}
      generateSQLQuery={generateSalesToolsSQL}
    />
  )
}
