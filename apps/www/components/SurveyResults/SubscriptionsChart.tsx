import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateSubscriptionsSQL(activeFilters: Record<string, string>) {
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
  unnest(subscriptions) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
UNION ALL
SELECT 
  'None of the above' AS technology,
  COUNT(*) AS total
FROM responses_2025
WHERE subscriptions = '{}'
ORDER BY total DESC;
`
}

export function SubscriptionsChart() {
  return (
    <GenericChartWithQuery
      title="Which of the following subscriptions does your startup pay for your team?"
      targetColumn="subscriptions"
      filterColumns={['headquarters', 'industry_normalized', 'currently_monetizing']}
      generateSQLQuery={generateSubscriptionsSQL}
    />
  )
}
