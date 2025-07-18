import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generatePersonAgeSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.role !== 'unset') {
    whereClauses.push(`role = '${activeFilters.role}'`)
  }

  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  person_age,
  COUNT(*) AS total
FROM responses_2025_e${whereClause ? '\n' + whereClause : ''}
GROUP BY person_age
ORDER BY person_age ASC`
}

export function PersonAgeChart() {
  return (
    <GenericChartWithQuery
      title="What is your age?"
      targetColumn="person_age"
      filterColumns={['role', 'headquarters']}
      generateSQLQuery={generatePersonAgeSQL}
    />
  )
}
