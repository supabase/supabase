import { SurveyChart, buildWhereClause } from '../SurveyChart'

function generateSalesToolsSQL(activeFilters: Record<string, string>) {
  const whereClause = buildWhereClause(activeFilters)

  return `
  SELECT 
  unnest(sales_tools) AS tool_name,
  COUNT(*) AS total
FROM responses_c_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY tool_name
ORDER BY total DESC;
`
}

export function SalesToolsChart() {
  return (
    <SurveyChart
      title="What tools are you using to manage your sales process?"
      targetColumn="sales_tools"
      filterColumns={['person_age', 'location', 'team_size']}
      generateSQLQuery={generateSalesToolsSQL}
    />
  )
}
