import { GenericChartWithQuery } from './GenericChartWithQuery'

function generatePricingSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
  SELECT 
  unnest(pricing) AS pricing_model,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY pricing_model
ORDER BY total DESC;
`
}

export function PricingChart() {
  return (
    <GenericChartWithQuery
      title="TK: Pricing question"
      targetColumn="pricing"
      filterColumns={['team_count']}
      generateSQLQuery={generatePricingSQL}
    />
  )
}
