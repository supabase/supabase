import { SurveyChart } from '../SurveyChart'

function generateDatabasesSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
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
    <SurveyChart
      title="Which database(s) is your startup using?"
      targetColumn="databases"
      filterColumns={['person_age', 'team_count', 'money_raised']}
      generateSQLQuery={generateDatabasesSQL}
    />
  )
}
