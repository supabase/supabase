import { GenericChartWithQuery } from './GenericChartWithQuery'

// Generate SQL query for team count chart
function generateRoleSQL(activeFilters) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }
  if (activeFilters.funding_stage !== 'unset') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }
  if (activeFilters.headquarters !== 'unset') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  person_role_normalized,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY person_role_normalized
ORDER BY total DESC
`
}

export function RoleChart() {
  return (
    <GenericChartWithQuery
      title="What is your functional role at your startup?"
      targetColumn="person_role_normalized"
      filterColumns={['person_age', 'funding_stage', 'headquarters']}
      generateSQLQuery={generateRoleSQL}
    />
  )
}
