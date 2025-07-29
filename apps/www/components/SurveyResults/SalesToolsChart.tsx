import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateSalesToolsSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.first_sales_hire_stage !== 'unset') {
    whereClauses.push(`first_sales_hire_stage = '${activeFilters.first_sales_hire_stage}'`)
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
      title="What tools are you using to manage your sales process?"
      targetColumn="sales_tools"
      filterColumns={['team_count', 'funding_stage', 'first_sales_hire_stage']}
      generateSQLQuery={generateSalesToolsSQL}
    />
  )
}
