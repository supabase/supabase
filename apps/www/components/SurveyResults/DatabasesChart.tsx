import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for funding stage chart
function generateDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.frontend_stack !== 'unset') {
    whereClauses.push(`'${activeFilters.frontend_stack}' = ANY(frontend_stack)`)
  }

  if (activeFilters.backend_stack !== 'unset') {
    whereClauses.push(`'${activeFilters.backend_stack}' = ANY(backend_stack)`)
  }

  if (activeFilters.industry_normalized !== 'unset') {
    whereClauses.push(`industry_normalized = '${activeFilters.industry_normalized}'`)
  }

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `
  SELECT 
  unnest(databases) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function DatabasesChart() {
  return (
    <GenericChartWithQuery
      title="Which database(s) is your startup using?"
      targetColumn="databases"
      filterColumns={['frontend_stack', 'backend_stack', 'industry_normalized', 'person_age']}
      generateSQLQuery={generateDatabasesSQL}
    />
  )
}
