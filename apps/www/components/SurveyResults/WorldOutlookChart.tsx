import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateWorldOutlookSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.role !== 'unset') {
    whereClauses.push(`role = '${activeFilters.role}'`)
  }

  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT 
  world_outlook, 
  COUNT(*) AS total
  --ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY world_outlook
ORDER BY total DESC;`
}

export function WorldOutlookChart() {
  return (
    <GenericChartWithQuery
      title="Given the state of the world, are you…"
      targetColumn="world_outlook"
      filterColumns={['role', 'funding_stage', 'headquarters']}
      generateSQLQuery={generateWorldOutlookSQL}
    />
  )
}
