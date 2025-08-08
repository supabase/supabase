import { GenericChartWithQuery } from './GenericChartWithQuery'

function generateDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.ai_models_used !== 'unset') {
    whereClauses.push(`'${activeFilters.ai_models_used}' = ANY(ai_models_used)`)
  }

  if (activeFilters.backend_stack !== 'unset') {
    whereClauses.push(`'${activeFilters.backend_stack}' = ANY(backend_stack)`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  unnest(databases) AS technology,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY technology
ORDER BY total DESC;`
}

export function DatabasesChart() {
  return (
    <GenericChartWithQuery
      title="Which database(s) is your startup using?"
      targetColumn="databases"
      filterColumns={['team_count', 'ai_models_used', 'backend_stack']}
      generateSQLQuery={generateDatabasesSQL}
    />
  )
}
