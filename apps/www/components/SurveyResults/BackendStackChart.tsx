import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateBackendStackSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.headquarters !== 'all') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.currently_monetizing !== 'all') {
    whereClauses.push(`currently_monetizing = '${activeFilters.currently_monetizing}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
  SELECT 
  unnest(backend_stack) AS technology,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function BackendStackChart() {
  return (
    <GenericChartWithQuery
      title="What is your startup's backend stack?"
      targetColumn="backend_stack"
      filterColumns={['headquarters', 'currently_monetizing']}
      generateSQLQuery={generateBackendStackSQL}
    />
  )
}
