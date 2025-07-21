import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateRoleSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  role,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY role
ORDER BY total DESC`
}

export function RoleChart() {
  return (
    <GenericChartWithQuery
      title="What is your functional role at your startup?"
      targetColumn="role"
      filterColumns={['person_age']}
      generateSQLQuery={generateRoleSQL}
    />
  )
}
