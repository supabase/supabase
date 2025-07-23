import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateCloudProvidersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.currently_monetizing !== 'unset') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  if (activeFilters.backend_stack !== 'unset') {
    whereClauses.push(`'${activeFilters.backend_stack}' = ANY(backend_stack)`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `WITH expanded AS (
  SELECT unnest(cloud_providers) AS technology
  FROM responses_2025${whereClause ? '\n' + whereClause : ''}
)
SELECT 
  technology,
  COUNT(*) AS total
FROM expanded
GROUP BY technology
ORDER BY total DESC;`
}

export function CloudProvidersChart() {
  return (
    <GenericChartWithQuery
      title="Which cloud provider(s) is your startup using?"
      targetColumn="observability"
      filterColumns={['currently_monetizing', 'money_raised', 'backend_stack']}
      generateSQLQuery={generateCloudProvidersSQL}
    />
  )
}
