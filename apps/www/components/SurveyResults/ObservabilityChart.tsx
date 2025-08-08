import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateObservabilitySQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `WITH expanded AS (
  SELECT unnest(observability) AS technology
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
)
SELECT 
  technology,
  COUNT(*) AS total
FROM expanded
WHERE technology NOT IN ('We don''t use observability tools yet', 'Not yet')
GROUP BY technology
ORDER BY total DESC;`
}

export function ObservabilityChart() {
  return (
    <GenericChartWithQuery
      title="Which tools are your startup currently using for monitoring and observability? (Filtered)"
      targetColumn="observability"
      filterColumns={['currently_monetizing', 'money_raised']}
      generateSQLQuery={generateObservabilitySQL}
    />
  )
}
