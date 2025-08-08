import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateVectorDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.databases !== 'unset') {
    whereClauses.push(`'${activeFilters.databases}' = ANY(databases)`)
  }

  // TODO: Returns actual row values (e.g. "Weweb,Svelte,React") instead of just "Svelte"
  // FilterDropdown should be able to handle these as separate, unique values
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  unnest(vector_databases) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;
`
}

export function VectorDatabasesChart() {
  return (
    <GenericChartWithQuery
      title="Which vector database(s) is your startup using? (Filtered)"
      targetColumn="vector_databases"
      filterColumns={['databases']}
      generateSQLQuery={generateVectorDatabasesSQL}
    />
  )
}
