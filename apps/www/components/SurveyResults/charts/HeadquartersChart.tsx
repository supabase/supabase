import { SurveyChart } from '../SurveyChart'

function generateHeadquartersSQL(activeFilters: Record<string, string>) {
  const whereClauses = []

  if (activeFilters.money_raised !== 'unset') {
    whereClauses.push(`money_raised = '${activeFilters.money_raised}'`)
  }

  if (activeFilters.team_count !== 'unset') {
    whereClauses.push(`team_count = '${activeFilters.team_count}'`)
  }

  if (activeFilters.person_age !== 'unset') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  headquarters,
  COUNT(*) AS total
FROM responses_2025${whereClause ? '\n' + whereClause : ''}
GROUP BY headquarters
ORDER BY total DESC;`
}

export function HeadquartersChart() {
  return (
    <SurveyChart
      title="Where is your startup headquartered?"
      targetColumn="headquarters"
      filterColumns={['person_age', 'team_count', 'money_raised']}
      generateSQLQuery={generateHeadquartersSQL}
    />
  )
}
