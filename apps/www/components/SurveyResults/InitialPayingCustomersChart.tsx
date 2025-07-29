import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateInitialPayingCustomersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  // Always filter out NULL values
  // whereClauses.push(`initial_paying_customers IS NOT NULL`)
  // whereClauses.push(`initial_paying_customers != ''`)

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  if (activeFilters.market_model !== 'unset') {
    whereClauses.push(`'${activeFilters.market_model}' = ANY(market_model)`)
  }

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  source,
  COUNT(DISTINCT id) AS respondents
FROM (
  SELECT id, unnest(initial_paying_customers) AS source
  FROM responses_2025${whereClause ? '\n' + whereClause : ''}
) sub
GROUP BY source
ORDER BY respondents DESC;`
}

export function InitialPayingCustomersChart() {
  return (
    <GenericChartWithQuery
      title="Where did your startup’s initial paying customers come from?"
      targetColumn="initial_paying_customers"
      filterColumns={['industry_normalized', 'market_model', 'currently_monetizing']}
      generateSQLQuery={generateInitialPayingCustomersSQL}
    />
  )
}
